import { httpBase, type HttpBaseOptions, type HttpError } from "@/shared/api/httpBase";
import { session } from "@/entities/session/model/sessionStore";
import { globalLoading } from "@/shared/model/globalLoading";
import { toastStore } from "@/shared/model/toastStore";

// refresh 동시 호출 방지
let refreshInFlight: Promise<string | null> | null = null;

type RefreshResponse = { accessToken: string };

function getServerErrorCode(err: HttpError): string | null {
  const body = err?.body as any;
  return typeof body?.error === "string" ? body.error : null;
}

function shouldRefresh(err: HttpError) {
  if (err?.status !== 401) return false;
  const token = session.getToken();
  if (!token) return false;
  const code = getServerErrorCode(err);
  if (code === "JWT 토큰이 만료되었습니다.") return true;
  return false;
}

// ✅ authHttp.ts 내부에서만 쓰는 헤더 정규화
function normalizeHeaders(h?: HeadersInit): Record<string, string> {
  if (!h) return {};
  if (h instanceof Headers) return Object.fromEntries(h.entries());
  if (Array.isArray(h)) return Object.fromEntries(h);
  return { ...(h as Record<string, string>) };
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const r = await httpBase<RefreshResponse>("/auth/token/refresh", {
          method: "POST",
          headers: authHeader(), // ✅ Record<string,string>만 반환
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

function authHeader(): Record<string, string> {
  const token = session.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type AuthHttpOptions = HttpBaseOptions & {
  retryOnAuthError?: boolean;
  showGlobalLoading?: boolean;
  showErrorToast?: boolean;
  errorToastTitle?: string;
};

export async function authHttp<T>(input: RequestInfo, init?: AuthHttpOptions): Promise<T> {
  const retryOnAuthError = init?.retryOnAuthError ?? true;
  const showGlobalLoading = init?.showGlobalLoading ?? true;
  const showErrorToast = init?.showErrorToast ?? true;
  const errorToastTitle = init?.errorToastTitle ?? "오류";

  // ✅ init.headers도 Record로 정규화해서 병합 (spread로 HeadersInit 섞지 않기)
  const initHeaders = normalizeHeaders(init?.headers);

  const call = (extraHeaders?: Record<string, string>) =>
    httpBase<T>(input, {
      ...init,
      headers: {
        ...authHeader(),
        ...initHeaders,
        ...(extraHeaders || {}),
      },
    });

  if (showGlobalLoading) globalLoading.start();

  try {
    try {
      return await call();
    } catch (e) {
      const err = e as HttpError;

      if (retryOnAuthError && shouldRefresh(err)) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return await call({ Authorization: `Bearer ${newToken}` });
        }
      }

      if (showErrorToast) {
        // 프로젝트 toastStore API에 맞춤(push vs getState().push 등 혼용 가능)
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
