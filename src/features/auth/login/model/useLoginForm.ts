import { useMemo, useState } from "react";
import { isValidEmail } from "@/shared/lib/validators";

export function useLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!email || !password) return false;
    if (!isValidEmail(email)) return false;
    if (password.length < 6) return false;
    return true;
  }, [email, password]);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      // TODO: 여기에서 실제 로그인 API/Supabase 연동
      // await authApi.signIn({ email, password });

      await new Promise((r) => setTimeout(r, 600)); // 임시
      return true;
    } catch (e: any) {
      setError(e?.message ?? "로그인에 실패했습니다.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    password,
    setEmail,
    setPassword,
    loading,
    error,
    canSubmit,
    submit,
  };
}
