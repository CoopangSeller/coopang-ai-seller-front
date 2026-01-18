import { useEffect, useRef, useState } from "react";
import { lsGet, lsRemove, lsSet } from "@/shared/lib/storage/storage";

type DraftEnvelope<T> = { v: number; updatedAt: number; data: T };

export function useDraft<T>(
  key: string,
  initial: T,
  opts?: { ttlMs?: number; version?: number; debounceMs?: number }
) {
  const ttlMs = opts?.ttlMs ?? 7 * 24 * 60 * 60 * 1000;
  const version = opts?.version ?? 1;
  const debounceMs = opts?.debounceMs ?? 400;

  const [state, setState] = useState<T>(() => {
    const saved = lsGet<DraftEnvelope<T>>(key);
    if (!saved) return initial;
    if (saved.v !== version) return initial;

    const expired = Date.now() - saved.updatedAt > ttlMs;
    if (expired) {
      lsRemove(key);
      return initial;
    }
    return saved.data;
  });

  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      lsSet<DraftEnvelope<T>>(key, { v: version, updatedAt: Date.now(), data: state });
    }, debounceMs);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [key, state, version, debounceMs]);

  const clear = () => lsRemove(key);

  return { state, setState, clear };
}
