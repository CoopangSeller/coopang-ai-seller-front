import { httpBase } from "@/shared/api/httpBase";

export type RefreshResponse = { accessToken: string };

export function refreshApi() {
  return httpBase<RefreshResponse>("/auth/token/refresh", {
    method: "POST",
  });
}
