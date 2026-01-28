// src/shared/lib/async/withTimeout.ts
import { TimeoutError } from "./customErrors";

export function withTimeout<T>(factory: () => Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new TimeoutError(ms)), ms);

    factory()
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(id));
  });
}
