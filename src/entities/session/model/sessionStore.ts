import { useSyncExternalStore } from "react";
import { clearAccessToken, getAccessToken, setAccessToken } from "../lib/token";

type State = { accessToken: string | null };

let state: State = { accessToken: getAccessToken() };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const session = {
  getToken(): string | null {
    return state.accessToken;
  },
  setToken(token: string) {
    setAccessToken(token);
    state = { accessToken: token };
    emit();
  },
  clear() {
    clearAccessToken();
    state = { accessToken: null };
    emit();
  },
};

export function useSession() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state
  );
}
