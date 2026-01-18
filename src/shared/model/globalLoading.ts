import { useSyncExternalStore } from "react";

let count = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const globalLoading = {
  start() {
    count += 1;
    emit();
  },
  end() {
    count = Math.max(0, count - 1);
    emit();
  },
  getSnapshot() {
    return count;
  },
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};

export function useGlobalLoading() {
  const c = useSyncExternalStore(globalLoading.subscribe, globalLoading.getSnapshot);
  return c > 0;
}
