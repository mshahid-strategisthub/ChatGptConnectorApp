import { AsyncLocalStorage } from 'async_hooks';

const storage = new AsyncLocalStorage();

/**
 * Run an async handler with request-scoped context (e.g. Authorization header).
 * Call this in the /mcp handler so tool handlers can read the token.
 */
export function runWithRequestContext(context, fn) {
  return storage.run(context, fn);
}

/**
 * Get the Authorization header for the current request (e.g. Bearer token).
 * Returns undefined if not in a request context or no header.
 */
export function getRequestAuth() {
  const ctx = storage.getStore();
  return ctx?.authorization;
}
