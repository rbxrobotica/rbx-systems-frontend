/**
 * In-memory stand-in for the `@aws-sdk/client-s3` exports the content store
 * uses. It records every request the store sends, which is what the request
 * budget tests count. It can be switched to fail like an unreachable bucket,
 * and to keep requests waiting like a bucket that stopped answering.
 */
export function createFakeS3({ pageSize = 1000 } = {}) {
  const objects = new Map();
  const requests = [];
  let failure = null;
  let held = null;

  /**
   * Record a request, then give it the outcome it had when it was sent: a
   * request that is kept waiting does not see what changes while it waits.
   */
  const sent = async (request) => {
    requests.push(request);
    const failed = failure?.applies(request) ? failure.error : null;
    if (held?.applies(request)) await held.released;
    if (failed) throw failed;
  };

  class GetObjectCommand {
    constructor(input) {
      this.input = input;
    }
  }

  class ListObjectsV2Command {
    constructor(input) {
      this.input = input;
    }
  }

  class S3Client {
    async send(command) {
      if (command instanceof ListObjectsV2Command) {
        await sent({ command: 'ListObjectsV2', prefix: command.input.Prefix });
        const keys = [...objects.keys()].filter((key) => key.startsWith(command.input.Prefix));
        const start = Number(command.input.ContinuationToken ?? 0);
        const end = start + pageSize;
        return {
          Contents: keys.slice(start, end).map((Key) => ({ Key })),
          IsTruncated: end < keys.length,
          NextContinuationToken: end < keys.length ? String(end) : undefined
        };
      }

      await sent({ command: 'GetObject', key: command.input.Key });
      const object = objects.get(command.input.Key);
      if (object === undefined) {
        throw Object.assign(new Error('The specified key does not exist.'), { name: 'NoSuchKey' });
      }
      return {
        Body: {
          transformToString: async () => String(object),
          transformToByteArray: async () => new TextEncoder().encode(String(object))
        },
        ContentType: 'application/octet-stream',
        ETag: `"${object.length}"`
      };
    }
  }

  return {
    /** Pass as the `@aws-sdk/client-s3` external of the content store. */
    module: { S3Client, GetObjectCommand, ListObjectsV2Command },
    objects,
    requests,
    /**
     * Make the following requests reject with `error`: all of them, or the
     * ones `applies` selects. Pass null to recover.
     */
    failWith(error, applies = () => true) {
      failure = error ? { error, applies } : null;
    },
    /**
     * Keep the following requests `applies` selects waiting. Returns the
     * function that lets them, and every later request, through.
     */
    hold(applies = () => true) {
      let release;
      const released = new Promise((resolve) => (release = resolve));
      held = { applies, released };
      return () => {
        held = null;
        release();
      };
    },
    /** Return the requests recorded since the last call and forget them. */
    takeRequests() {
      return requests.splice(0);
    }
  };
}
