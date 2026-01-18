import { useSyncExternalStore } from "react";
import {
  clearAccessToken,
  clearUsername,
  getAccessToken,
  getUsername,
  setAccessToken,
  setUsername,
} from "../lib/sessionStorage";

type State = {
  accessToken: string | null;
  username: string | null;
};

let state: State = {
  accessToken: getAccessToken(),
  username: getUsername(),
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const session = {
  getToken(): string | null {
    return state.accessToken;
  },
  getUsername(): string | null {
    return state.username;
  },

  setAuth(payload: { accessToken: string; username: string }) {
    setAccessToken(payload.accessToken);
    setUsername(payload.username);
    state = { accessToken: payload.accessToken, username: payload.username };
    emit();
  },

  setToken(token: string) {
    // refresh가 username을 안 내려주는 경우를 대비해 username 유지
    setAccessToken(token);
    state = { ...state, accessToken: token };
    emit();
  },

  clear() {
    clearAccessToken();
    clearUsername();
    state = { accessToken: null, username: null };
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
