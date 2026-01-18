import { session } from "@/entities/session/model/sessionStore";
import { globalLoading } from "@/shared/model/globalLoading";
import { toastStore } from "@/shared/model/toastStore";
import { refreshApi } from "@/features/auth/refresh/api/refreshApi";

export type HttpError = {
  status: number;
  message: string;
  body?: unknown;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function resolveUrl(input: RequestInfo) {
  if (typeof input === "string" && input.startsWith("/")) return `${API_BASE}${input}`;
  return input;
}

async function parseBody(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json().catch(() => undefined);
  return res.text().catch(() => undefined);
}

function toHttpError(status: number, body: unknown): HttpError {
  const msg =
    typeof body === "string"
      ? body
      : (body as any)?.message || (status === 401 ? "인증이 만료되었습니다." : "요청에 실패했습니다.");
  return { status, message: msg, body };
}

function authHeader() {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// refresh 동시 호출 방지
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const r = await refreshApi();
        session.setToken(r.accessToken);
        return r.accessToken;
      } catch {
        session.clear();
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

type HttpOptions = RequestInit & {
  retryOnAuthError?: boolean;       // default true
  showGlobalLoading?: boolean;      // default true
  showErrorToast?: boolean;         // default true
  errorToastTitle?: string;         // default "오류"
};

export async function http<T>(input: RequestInfo, init?: HttpOptions): Promise<T> {
  const retryOnAuthError = init?.retryOnAuthError ?? true;
  const showGlobalLoading = init?.showGlobalLoading ?? true;
  const showErrorToast = init?.showErrorToast ?? true;
  const errorToastTitle = init?.errorToastTitle ?? "오류";

  const doFetch = async () =>
    fetch(resolveUrl(input), {
      ...init,
      credentials: "include", // refresh 쿠키
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
        ...(init?.headers || {}),
      },
    });

  if (showGlobalLoading) globalLoading.start();

  try {
    let res = await doFetch();

    // 401 -> refresh -> retry 1회
    if (res.status === 401 && retryOnAuthError) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        res = await doFetch();
      }
    }

    if (!res.ok) {
      const body = await parseBody(res);
      const err = toHttpError(res.status, body);

      if (showErrorToast) {
        toastStore.push({ type: "error", title: errorToastTitle, message: err.message });
      }
      throw err;
    }

    return (await parseBody(res)) as T;
  } finally {
    if (showGlobalLoading) globalLoading.end();
  }
}
