import { useMemo, useState } from "react";
import { signUpApi } from "../api/signUpApi";
import { session } from "@/entities/session/model/sessionStore";
import { toastStore } from "@/shared/model/toastStore";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useSignupForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!username.trim()) return false;
    if (!emailRegex.test(email.trim())) return false;
    if (password.length < 8) return false;
    if (!agreedTerms || !agreedPrivacy) return false;
    return true;
  }, [username, email, password, agreedTerms, agreedPrivacy]);

  const submit = async () => {
    setError(null);
    if (!canSubmit) {
      setError("입력값/약관 동의를 확인해주세요.");
      return false;
    }

    setLoading(true);
    try {
      const res = await signUpApi({
        username: username.trim(),
        email: email.trim(),
        password,
        agreedTerms,
        agreedPrivacy,
      });
      session.setToken(res.accessToken);
      toastStore.push({ type: "success", title: "완료", message: "회원가입 되었습니다." });
      return true;
    } catch (e: any) {
      setError(e?.message ?? "회원가입에 실패했습니다.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    username, email, password,
    agreedTerms, agreedPrivacy,
    setUsername, setEmail, setPassword,
    setAgreedTerms, setAgreedPrivacy,
    loading, error, canSubmit, submit,
  };
}