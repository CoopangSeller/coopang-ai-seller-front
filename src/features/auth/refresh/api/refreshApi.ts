import { http } from "@/shared/api/http";

export type RefreshResponse = { accessToken: string };

export function refreshApi() {
  return http<RefreshResponse>("/auth/token/refresh", {
    method: "POST",
    retryOnAuthError: false,
    showGlobalLoading: false,
    showErrorToast: false,
  });
}
