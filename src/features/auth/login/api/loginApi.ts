import { authHttp } from "@/entities/session/api/authHttp";
import type { LoginRequest, LoginResponse } from "@/shared/types/auth";

export function loginApi(body: LoginRequest) {
  return authHttp<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    retryOnAuthError: false,
    errorToastTitle: "로그인 실패",
  });
}
