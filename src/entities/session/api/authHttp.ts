import { httpBase, type HttpBaseOptions, type HttpError } from "@/shared/api/httpBase";
import { session } from "@/entities/session/model/sessionStore";
import { globalLoading } from "@/shared/model/globalLoading";
import { toastStore } from "@/shared/model/toastStore";

// refresh 동시 호출 방지
let refreshInFlight: Promise<string | null> | null = null;

type RefreshResponse = { accessToken: string };

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        // ⚠️ features/auth/refreshApi를 import하지 않고, 여기서 직접 호출해 순환 의존 제거
        const r = await httpBase<RefreshResponse>("/auth/token/refresh", {
          method: "POST",
          // refresh는 조용히 처리 (로딩/토스트 없음)
        });
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

function authHeader() {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type AuthHttpOptions = HttpBaseOptions & {
  retryOnAuthError?: boolean;  // default true
  showGlobalLoading?: boolean; // default true
  showErrorToast?: boolean;    // default true
  errorToastTitle?: string;    // default "오류"
};

export async function authHttp<T>(input: RequestInfo, init?: AuthHttpOptions): Promise<T> {
  const retryOnAuthError = init?.retryOnAuthError ?? true;
  const showGlobalLoading = init?.showGlobalLoading ?? true;
  const showErrorToast = init?.showErrorToast ?? true;
  const errorToastTitle = init?.errorToastTitle ?? "오류";

  const call = (extraHeaders?: Record<string, string>) =>
    httpBase<T>(input, {
      ...init,
      headers: {
        ...authHeader(),
        ...(init?.headers || {}),
        ...(extraHeaders || {}),
      },
    });

  if (showGlobalLoading) globalLoading.start();

  try {
    try {
      return await call();
    } catch (e) {
      const err = e as HttpError;

      if (err?.status === 401 && retryOnAuthError) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return await call({ Authorization: `Bearer ${newToken}` });
        }
      }

      if (showErrorToast) {
        toastStore.push({
          type: "error",
          title: errorToastTitle,
          message: err?.message ?? "요청 실패",
        });
      }
      throw e;
    }
  } finally {
    if (showGlobalLoading) globalLoading.end();
  }
}
