import { useEffect, useRef, useState } from "react";
import { session } from "@/entities/session/model/sessionStore";
import { refreshApi } from "@/features/auth/refresh/api/refreshApi";

/**
 * 앱 최초 진입 시 1회:
 * - accessToken이 없으면 refreshToken(쿠키)로 refresh 시도
 * - 성공하면 session에 accessToken 저장
 * - 실패하면 그냥 비인증 상태로 둠
 */
export function useAuthBootstrap() {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = session.getToken();
    if (token) {
      setBootstrapped(true);
      return;
    }

    (async () => {
      setBootstrapping(true);
      try {
        const res = await refreshApi();
        session.setToken(res.accessToken);
      } catch {
        // refresh 실패는 정상 케이스(미로그인/만료)
        session.clear();
      } finally {
        setBootstrapping(false);
        setBootstrapped(true);
      }
    })();
  }, []);

  return { bootstrapped, bootstrapping };
}
