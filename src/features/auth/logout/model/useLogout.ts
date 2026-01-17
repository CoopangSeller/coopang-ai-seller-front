import { session } from "@/entities/session/model/sessionStore";
import { logoutApi } from "../api/logoutApi";

export async function logout() {
  try {
    await logoutApi();
  } finally {
    // 서버 실패여도 로컬 세션은 제거하는 게 UX 상 안전
    session.clear();
  }
}
