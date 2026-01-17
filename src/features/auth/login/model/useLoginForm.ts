import { useMemo, useState } from "react";
import { loginApi } from "../api/loginApi";
import { session } from "@/entities/session/model/sessionStore";
import { toastStore } from "@/shared/model/toastStore";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!emailRegex.test(email.trim())) return false;
    if (!password) return false;
    return true;
  }, [email, password]);

  const submit = async () => {
    setError(null);
    if (!canSubmit) {
      setError("이메일/비밀번호를 확인해주세요.");
      return false;
    }

    setLoading(true);
    try {
      const res = await loginApi({ email: email.trim(), password });
      session.setAuth({ accessToken: res.accessToken, username: res.username });
      toastStore.push({ type: "success", title: "완료", message: "로그인 되었습니다." });
      return true;
    } catch (e: any) {
      // http.ts에서 토스트가 이미 뜨지만, 폼 내부 에러 UI도 원하면 여기서 세팅
      setError(e?.message ?? "로그인에 실패했습니다.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { email, password, setEmail, setPassword, loading, error, canSubmit, submit };
}
