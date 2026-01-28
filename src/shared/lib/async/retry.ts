import { sleep } from "./sleep";

export async function retryOnce<T>(
  fn: () => Promise<T>,
  options?: {
    delayMs?: number;
    shouldRetry?: (error: unknown) => boolean;
  },
): Promise<T> {
  const delayMs = options?.delayMs ?? 800;
  const shouldRetry = options?.shouldRetry ?? (() => true);

  try {
    return await fn();
  } catch (e) {
    if (!shouldRetry(e)) {
      throw e;
    }

    await sleep(delayMs);
    return await fn();
  }
}
