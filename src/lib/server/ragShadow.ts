const SHADOW_ENDPOINT = '/rbx/v1/rag/shadow/retrieve';
const TENANT = 'public';
const PRODUCT = 'rbx-site';
const WORKFLOW = 'public-assistant-shadow';
const PACKAGE_ID = 'rbx-rag-public-assistant';
const VISIBILITY = 'public';
const RESULT_LIMIT = 5;
const MAX_QUERY_BYTES = 4_000;
const MAX_RESPONSE_BYTES = 262_144;
const MAX_TIMEOUT_MS = 5_000;
const DEFAULT_TIMEOUT_MS = 1_500;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Environment = Record<string, string | undefined>;
type SafeMetadata = Record<string, string | number>;
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

interface ShadowLogger {
  info(message: string, metadata?: SafeMetadata): void;
  warn(message: string, metadata?: SafeMetadata): void;
}

interface ShadowConfig {
  baseUrl: string;
  token: string;
  timeoutMs: number;
}

type ConfigResolution =
  | { status: 'disabled' }
  | { status: 'invalid' }
  | { status: 'enabled'; config: ShadowConfig };

export type RagShadowOutcome =
  | { status: 'disabled' }
  | { status: 'skipped'; reason: 'invalid_query' }
  | {
      status: 'success';
      traceId: string;
      auditId: string;
      hitCount: number;
    }
  | {
      status: 'failed';
      reason:
        | 'invalid_configuration'
        | 'dependency_refused'
        | 'malformed_response'
        | 'timeout'
        | 'dependency_error';
    };

export interface RunRagShadowOptions {
  query: string;
  environment: Environment;
  fetchImpl?: FetchLike;
  logger?: ShadowLogger;
}

function enabled(value: string | undefined): boolean {
  return ['1', 'on', 'true', 'yes'].includes(value?.trim().toLowerCase() ?? '');
}

function resolveConfig(environment: Environment): ConfigResolution {
  if (!enabled(environment.THALAMUS_RAG_SHADOW_ENABLED)) {
    return { status: 'disabled' };
  }

  const rawUrl = environment.THALAMUS_URL?.trim().replace(/\/+$/, '');
  const token = environment.THALAMUS_RAG_TOKEN?.trim();
  const timeoutValue = environment.THALAMUS_RAG_SHADOW_TIMEOUT_MS?.trim();
  const timeoutMs = timeoutValue ? Number(timeoutValue) : DEFAULT_TIMEOUT_MS;

  if (
    !rawUrl ||
    !token ||
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > MAX_TIMEOUT_MS
  ) {
    return { status: 'invalid' };
  }

  try {
    const url = new URL(rawUrl);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return { status: 'invalid' };
    }
  } catch {
    return { status: 'invalid' };
  }

  return {
    status: 'enabled',
    config: { baseUrl: rawUrl, token, timeoutMs }
  };
}

function boundedString(value: unknown, maxBytes: number): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    new TextEncoder().encode(value).byteLength <= maxBytes
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validHit(value: unknown): boolean {
  if (!isRecord(value) || 'source_uri' in value) return false;

  return (
    boundedString(value.chunk_id, 2_048) &&
    boundedString(value.document_id, 2_048) &&
    boundedString(value.content, 65_536) &&
    boundedString(value.locale, 64) &&
    typeof value.score === 'number' &&
    Number.isFinite(value.score)
  );
}

function validResponse(value: unknown): value is {
  trace_id: string;
  audit_id: string;
  hits: unknown[];
} {
  if (!isRecord(value)) return false;
  if ('answer' in value || 'choices' in value || 'message' in value) return false;

  return (
    value.mode === 'shadow' &&
    value.package_id === PACKAGE_ID &&
    value.visibility === VISIBILITY &&
    boundedString(value.model_alias, 128) &&
    typeof value.trace_id === 'string' &&
    UUID_PATTERN.test(value.trace_id) &&
    typeof value.audit_id === 'string' &&
    UUID_PATTERN.test(value.audit_id) &&
    boundedString(value.embedding_trace_id, 128) &&
    boundedString(value.embedding_audit_id, 128) &&
    Array.isArray(value.hits) &&
    value.hits.length <= RESULT_LIMIT &&
    value.hits.every(validHit)
  );
}

async function readBoundedJson(response: Response): Promise<unknown> {
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
    throw new Error('response_too_large');
  }
  if (!response.body) throw new Error('missing_response_body');

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error('response_too_large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

export async function runRagShadow({
  query,
  environment,
  fetchImpl = fetch,
  logger = console
}: RunRagShadowOptions): Promise<RagShadowOutcome> {
  const resolution = resolveConfig(environment);
  if (resolution.status === 'disabled') return { status: 'disabled' };
  if (resolution.status === 'invalid') {
    logger.warn('[rag-shadow] skipped', { reason: 'invalid_configuration' });
    return { status: 'failed', reason: 'invalid_configuration' };
  }

  const normalizedQuery = typeof query === 'string' ? query.trim() : '';
  if (!boundedString(normalizedQuery, MAX_QUERY_BYTES)) {
    logger.warn('[rag-shadow] skipped', { reason: 'invalid_query' });
    return { status: 'skipped', reason: 'invalid_query' };
  }

  const { config } = resolution;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetchImpl(`${config.baseUrl}${SHADOW_ENDPOINT}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenant: TENANT,
        product: PRODUCT,
        workflow: WORKFLOW,
        package_id: PACKAGE_ID,
        visibility: VISIBILITY,
        query: normalizedQuery,
        limit: RESULT_LIMIT
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      logger.warn('[rag-shadow] dependency refused', {
        reason: 'dependency_refused',
        status: response.status
      });
      return { status: 'failed', reason: 'dependency_refused' };
    }

    let payload: unknown;
    try {
      payload = await readBoundedJson(response);
    } catch {
      logger.warn('[rag-shadow] invalid response', { reason: 'malformed_response' });
      return { status: 'failed', reason: 'malformed_response' };
    }
    if (!validResponse(payload)) {
      logger.warn('[rag-shadow] invalid response', { reason: 'malformed_response' });
      return { status: 'failed', reason: 'malformed_response' };
    }

    const outcome = {
      status: 'success' as const,
      traceId: payload.trace_id,
      auditId: payload.audit_id,
      hitCount: payload.hits.length
    };
    logger.info('[rag-shadow] completed', {
      trace_id: outcome.traceId,
      audit_id: outcome.auditId,
      hit_count: outcome.hitCount
    });
    return outcome;
  } catch (caught) {
    const reason =
      caught instanceof Error && caught.name === 'AbortError' ? 'timeout' : 'dependency_error';
    logger.warn('[rag-shadow] dependency unavailable', { reason });
    return { status: 'failed', reason };
  } finally {
    clearTimeout(timeout);
  }
}
