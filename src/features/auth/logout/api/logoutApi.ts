import { authHttp } from "@/entities/session/api/authHttp";

export function logoutApi() {
  return authHttp<void>("/auth/logout", {
    method: "POST",
  });
}
