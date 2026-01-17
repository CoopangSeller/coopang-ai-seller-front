import { http } from "@/shared/api/http";

export function logoutApi() {
  return http<void>("/auth/logout", {
    method: "POST",
    // 만약 accessToken이 만료되어도 refresh 후 재시도 가능(기본 true)
  });
}
