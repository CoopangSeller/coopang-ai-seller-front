import { http } from "@/shared/api/http";
import type { LoginResponse, SignUpRequest } from "@/shared/types/auth";

export function signUpApi(body: SignUpRequest) {
  return http<LoginResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
    retryOnAuthError: false,
    errorToastTitle: "회원가입 실패",
  });
}