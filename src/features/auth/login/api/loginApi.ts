import { http } from "@/shared/api/http";
import type { LoginRequest, LoginResponse } from "@/shared/types/auth";

export function loginApi(body: LoginRequest) {
  return http<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    retryOnAuthError: false,  // 로그인은 refresh 재시도 불필요
    errorToastTitle: "로그인 실패",
  });
}
