import { useSyncExternalStore } from "react";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number; // default 3000
};

let toasts: Toast[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export const toastStore = {
  push(input: Omit<Toast, "id">) {
    const t: Toast = { id: uid(), durationMs: 3000, ...input };
    toasts = [...toasts, t];
    emit();

    window.setTimeout(() => {
      toastStore.remove(t.id);
    }, t.durationMs);
  },
  remove(id: string) {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  },
  clear() {
    toasts = [];
    emit();
  },
  getSnapshot() {
    return toasts;
  },
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};

export function useToasts() {
  return useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot);
}
