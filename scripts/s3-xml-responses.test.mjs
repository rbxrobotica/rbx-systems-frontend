// The content store (src/lib/server/content/store.ts) relies on the AWS SDK to read two
// kinds of XML from the storage provider: the listing of keys and the error body of a
// request that failed. These tests run the real S3 client against canned responses, with
// no network, so a change of the SDK's XML parser cannot alter either without failing here.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand
} from '@aws-sdk/client-s3';

const encoder = new TextEncoder();

/** A client that answers each request with the next canned response. */
function clientAnswering(responses, seen = []) {
  const queue = [...responses];
  const client = new S3Client({
    endpoint: 'http://127.0.0.1',
    region: 'default',
    forcePathStyle: true,
    maxAttempts: 1,
    credentials: { accessKeyId: 'fixture', secretAccessKey: 'fixture' },
    requestHandler: {
      handle: async (request) => {
        seen.push(request.query ?? {});
        const next = queue.shift();
        assert.ok(next, 'the client sent more requests than the test answers');
        return {
          response: {
            statusCode: next.status,
            headers: { 'content-type': 'application/xml' },
            body: encoder.encode(next.body)
          }
        };
      },
      destroy: () => {}
    }
  });
  return client;
}

const DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
/** UTF-8 byte order mark: allowed before the declaration by the XML specification. */
const BOM = '\uFEFF';
const NAMESPACE = 'xmlns="http://s3.amazonaws.com/doc/2006-03-01/"';

function entry(key, size) {
  return (
    `<Contents><Key>${key}</Key><LastModified>2026-11-03T12:00:00.000Z</LastModified>` +
    `<ETag>&quot;0123456789abcdef0123456789abcdef&quot;</ETag><Size>${size}</Size>` +
    `<StorageClass>STANDARD</StorageClass></Contents>`
  );
}

test('a truncated listing yields its keys, the flag and the continuation token', async () => {
  const client = clientAnswering([
    {
      status: 200,
      body:
        `${DECLARATION}<ListBucketResult ${NAMESPACE}><Name>rbx-content</Name>` +
        `<Prefix>blog/posts/</Prefix><KeyCount>2</KeyCount><MaxKeys>1000</MaxKeys>` +
        `<IsTruncated>true</IsTruncated><NextContinuationToken>token+with/chars==</NextContinuationToken>` +
        entry('blog/posts/2026-11-03-post.pt-BR.md', 4096) +
        entry('blog/posts/2026-11-03-post.en.md', 2048) +
        `</ListBucketResult>`
    }
  ]);
  try {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: 'rbx-content', Prefix: 'blog/posts/' })
    );
    assert.deepEqual(
      res.Contents.map((o) => o.Key),
      ['blog/posts/2026-11-03-post.pt-BR.md', 'blog/posts/2026-11-03-post.en.md']
    );
    assert.equal(res.Contents[0].Size, 4096);
    assert.equal(res.Contents[0].ETag, '"0123456789abcdef0123456789abcdef"');
    assert.equal(res.Contents[0].LastModified.toISOString(), '2026-11-03T12:00:00.000Z');
    assert.equal(res.IsTruncated, true);
    assert.equal(res.NextContinuationToken, 'token+with/chars==');
  } finally {
    client.destroy();
  }
});

test('a listing with one object still yields a list, and the last page is not truncated', async () => {
  const client = clientAnswering([
    {
      status: 200,
      body:
        `${DECLARATION}<ListBucketResult ${NAMESPACE}><Name>rbx-content</Name>` +
        `<Prefix>site/</Prefix><KeyCount>1</KeyCount><MaxKeys>1000</MaxKeys>` +
        `<IsTruncated>false</IsTruncated>${entry('site/pt-BR/home/index.md', 512)}` +
        `</ListBucketResult>`
    }
  ]);
  try {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: 'rbx-content', Prefix: 'site/' })
    );
    assert.ok(Array.isArray(res.Contents));
    assert.deepEqual(
      res.Contents.map((o) => o.Key),
      ['site/pt-BR/home/index.md']
    );
    assert.equal(res.IsTruncated, false);
    assert.equal(res.NextContinuationToken, undefined);
  } finally {
    client.destroy();
  }
});

test('an empty listing has no contents', async () => {
  const client = clientAnswering([
    {
      status: 200,
      body:
        `${DECLARATION}<ListBucketResult ${NAMESPACE}><Name>rbx-content</Name>` +
        `<Prefix>nothing/</Prefix><KeyCount>0</KeyCount><MaxKeys>1000</MaxKeys>` +
        `<IsTruncated>false</IsTruncated></ListBucketResult>`
    }
  ]);
  try {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: 'rbx-content', Prefix: 'nothing/' })
    );
    assert.equal(res.Contents, undefined);
    assert.equal(res.IsTruncated, false);
  } finally {
    client.destroy();
  }
});

test('keys keep entities, accents and spaces, in an indented document too', async () => {
  const client = clientAnswering([
    {
      status: 200,
      body: [
        DECLARATION,
        `<ListBucketResult ${NAMESPACE}>`,
        '  <Name>rbx-content</Name>',
        '  <Prefix>assets/</Prefix>',
        '  <IsTruncated>false</IsTruncated>',
        '  <Contents>',
        '    <Key>assets/team/caf&#233; &amp; ch&#xE1; &lt;1&gt;.jpg</Key>',
        '    <Size>10</Size>',
        '  </Contents>',
        '  <Contents>',
        '    <Key>assets/team/flávia ribeiro.jpg</Key>',
        '    <Size>20</Size>',
        '  </Contents>',
        '</ListBucketResult>'
      ].join('\n')
    }
  ]);
  try {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: 'rbx-content', Prefix: 'assets/' })
    );
    assert.deepEqual(
      res.Contents.map((o) => o.Key),
      ['assets/team/café & chá <1>.jpg', 'assets/team/flávia ribeiro.jpg']
    );
    assert.deepEqual(
      res.Contents.map((o) => o.Size),
      [10, 20]
    );
  } finally {
    client.destroy();
  }
});

test('a missing object is reported as NoSuchKey, which the store turns into null', async () => {
  const client = clientAnswering([
    {
      status: 404,
      body:
        `${DECLARATION}<Error><Code>NoSuchKey</Code>` +
        `<Message>The specified key does not exist.</Message>` +
        `<Key>site/pt-BR/missing/index.md</Key><RequestId>fixture</RequestId></Error>`
    }
  ]);
  try {
    await assert.rejects(
      client.send(
        new GetObjectCommand({ Bucket: 'rbx-content', Key: 'site/pt-BR/missing/index.md' })
      ),
      (err) => {
        assert.equal(err.name, 'NoSuchKey');
        assert.equal(err.$metadata.httpStatusCode, 404);
        return true;
      }
    );
  } finally {
    client.destroy();
  }
});

test('any other storage error keeps its own code and is not mistaken for a missing object', async () => {
  const client = clientAnswering([
    {
      status: 403,
      body:
        `${DECLARATION}<Error><Code>AccessDenied</Code><Message>Access Denied</Message>` +
        `<RequestId>fixture</RequestId></Error>`
    }
  ]);
  try {
    await assert.rejects(
      client.send(new GetObjectCommand({ Bucket: 'rbx-content', Key: 'site/pt-BR/home/index.md' })),
      (err) => {
        assert.equal(err.name, 'AccessDenied');
        assert.equal(err.$metadata.httpStatusCode, 403);
        assert.notEqual(err.name, 'NotFound');
        return true;
      }
    );
  } finally {
    client.destroy();
  }
});

test('a listing is followed across pages with the token the first page returned', async () => {
  const page = (truncated, token, key) =>
    `${DECLARATION}<ListBucketResult ${NAMESPACE}><Name>rbx-content</Name>` +
    `<IsTruncated>${truncated}</IsTruncated>` +
    (token ? `<NextContinuationToken>${token}</NextContinuationToken>` : '') +
    `${entry(key, 1)}</ListBucketResult>`;
  const seen = [];
  const client = clientAnswering(
    [
      { status: 200, body: page(true, 'page-2-token', 'blog/posts/a.md') },
      { status: 200, body: page(false, undefined, 'blog/posts/b.md') }
    ],
    seen
  );
  try {
    // The loop of listObjectKeys in the content store.
    const keys = [];
    let token;
    do {
      const res = await client.send(
        new ListObjectsV2Command({
          Bucket: 'rbx-content',
          Prefix: 'blog/posts/',
          ContinuationToken: token
        })
      );
      for (const o of res.Contents ?? []) keys.push(o.Key);
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);
    assert.deepEqual(keys, ['blog/posts/a.md', 'blog/posts/b.md']);
    assert.equal(seen.length, 2);
    assert.equal(seen[0]['continuation-token'], undefined);
    assert.equal(seen[1]['continuation-token'], 'page-2-token');
  } finally {
    client.destroy();
  }
});

test('character references above U+FFFF decode to the character, in decimal and in hexadecimal', async () => {
  const client = clientAnswering([
    {
      status: 200,
      body:
        `${DECLARATION}<ListBucketResult ${NAMESPACE}><Name>rbx-content</Name>` +
        `<IsTruncated>false</IsTruncated>` +
        entry('assets/ui/&#x1F916;.svg', 1) +
        entry('assets/ui/&#129302;.svg', 1) +
        `</ListBucketResult>`
    }
  ]);
  try {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: 'rbx-content', Prefix: 'assets/ui/' })
    );
    assert.deepEqual(
      res.Contents.map((o) => o.Key),
      ['assets/ui/\u{1F916}.svg', 'assets/ui/\u{1F916}.svg']
    );
  } finally {
    client.destroy();
  }
});

test('a byte order mark before the document changes neither a listing nor an error', async () => {
  const client = clientAnswering([
    {
      status: 200,
      body:
        `${BOM}${DECLARATION}<ListBucketResult ${NAMESPACE}><Name>rbx-content</Name>` +
        `<IsTruncated>false</IsTruncated>${entry('site/pt-BR/home/index.md', 512)}` +
        `</ListBucketResult>`
    },
    {
      status: 404,
      body:
        `${BOM}${DECLARATION}<Error><Code>NoSuchKey</Code>` +
        `<Message>The specified key does not exist.</Message><RequestId>fixture</RequestId></Error>`
    }
  ]);
  try {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: 'rbx-content', Prefix: 'site/' })
    );
    assert.deepEqual(
      res.Contents.map((o) => o.Key),
      ['site/pt-BR/home/index.md']
    );
    await assert.rejects(
      client.send(
        new GetObjectCommand({ Bucket: 'rbx-content', Key: 'site/pt-BR/missing/index.md' })
      ),
      (err) => {
        assert.equal(err.name, 'NoSuchKey');
        return true;
      }
    );
  } finally {
    client.destroy();
  }
});

test('a listing cut in the middle is an error, not an empty or partial list', async () => {
  const client = clientAnswering([
    {
      status: 200,
      body: `${DECLARATION}<ListBucketResult ${NAMESPACE}><Contents><Key>blog/posts/a.md`
    }
  ]);
  try {
    await assert.rejects(
      client.send(new ListObjectsV2Command({ Bucket: 'rbx-content', Prefix: 'blog/posts/' }))
    );
  } finally {
    client.destroy();
  }
});

test('a refused conditional write keeps the code the recovery script checks', async () => {
  const client = clientAnswering([
    {
      status: 412,
      body:
        `${DECLARATION}<Error><Code>PreconditionFailed</Code>` +
        `<Message>At least one of the pre-conditions you specified did not hold</Message>` +
        `<Condition>If-Match</Condition><RequestId>fixture</RequestId></Error>`
    }
  ]);
  try {
    await assert.rejects(
      client.send(
        new PutObjectCommand({
          Bucket: 'rbx-content',
          Key: 'site/pt-BR/home/index.md',
          Body: 'reviewed',
          IfMatch: '0123456789abcdef0123456789abcdef'
        })
      ),
      (err) => {
        assert.equal(err.name, 'PreconditionFailed');
        assert.equal(err.$metadata.httpStatusCode, 412);
        return true;
      }
    );
  } finally {
    client.destroy();
  }
});
