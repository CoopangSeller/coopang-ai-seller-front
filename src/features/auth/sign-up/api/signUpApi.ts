import { authHttp } from "@/entities/session/api/authHttp";
import type { LoginResponse, SignUpRequest } from "@/shared/types";

export function signUpApi(body: SignUpRequest) {
  return authHttp<LoginResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
    retryOnAuthError: false,
    errorToastTitle: "회원가입 실패",
  });
}
