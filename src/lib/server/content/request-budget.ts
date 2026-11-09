/**
 * Storage request budget for the Content Gateway (RBX engineering guardrail
 * 1.1, N+1 detection).
 *
 * Counts the Object Storage requests each handled operation causes and warns
 * when an operation exceeds the budget. An operation is one HTTP request,
 * opened by the `handle` hook. It owns the cache loads the request blocks on
 * and also the background revalidations it starts, so a request answered from
 * a stale entry is still charged for the refresh it triggered.
 *
 * An operation over budget is reported twice:
 * - at once, when it issues its first request above the budget. This line
 *   does not depend on the operation ever finishing.
 * - with its total, when the handler has returned *and* every load it started
 *   has settled. An operation with a load that never settles has no total.
 *
 * The count is per storage command (one per LIST page, one per GET). SDK
 * retries of a failing command are not counted separately.
 */
import { AsyncLocalStorage } from 'node:async_hooks';

export const DEFAULT_STORAGE_REQUEST_BUDGET = 15;

const configured = Number(process.env.CONTENT_STORAGE_REQUEST_BUDGET);
const budget =
  Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_STORAGE_REQUEST_BUDGET;

interface Operation {
  name: string;
  requests: number;
  /** Requests per cache load, keyed by the load label. */
  loads: Map<string, number>;
  pendingLoads: number;
  handled: boolean;
  reported: boolean;
}

interface Context {
  operation: Operation;
  load?: string;
}

const current = new AsyncLocalStorage<Context>();

/** Run `handler` as one operation and report it if it goes over budget. */
export async function withStorageBudget<T>(name: string, handler: () => Promise<T>): Promise<T> {
  const operation: Operation = {
    name,
    requests: 0,
    loads: new Map(),
    pendingLoads: 0,
    handled: false,
    reported: false
  };
  try {
    return await current.run({ operation }, handler);
  } finally {
    operation.handled = true;
    settle(operation);
  }
}

/**
 * Run one cache load inside the current operation, keeping that operation open
 * until the load settles. A load started outside any operation is measured as
 * an operation of its own.
 */
export function trackLoad<T>(label: string, load: () => Promise<T>): Promise<T> {
  const context = current.getStore();
  if (!context) return withStorageBudget(label, load);

  const { operation } = context;
  operation.pendingLoads += 1;
  const result = current.run({ operation, load: label }, async () => load());
  const done = () => {
    operation.pendingLoads -= 1;
    settle(operation);
  };
  result.then(done, done);
  return result;
}

/** Record one storage request against the operation that is issuing it. */
export function countStorageRequest(): void {
  const context = current.getStore();
  if (!context) return;
  const { operation } = context;
  operation.requests += 1;
  if (context.load !== undefined) {
    operation.loads.set(context.load, (operation.loads.get(context.load) ?? 0) + 1);
  }
  if (operation.requests === budget + 1) warn('storage request budget exceeded', operation);
}

function settle(operation: Operation): void {
  if (!operation.handled || operation.pendingLoads > 0 || operation.reported) return;
  if (operation.requests <= budget) return;
  operation.reported = true;
  warn('storage request total over budget', operation);
}

function warn(message: string, operation: Operation): void {
  console.warn(
    `[content-gateway] ${message}`,
    JSON.stringify({
      operation: operation.name,
      requests: operation.requests,
      budget,
      loads: Object.fromEntries(operation.loads)
    })
  );
}
