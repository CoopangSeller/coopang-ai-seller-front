import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TextField } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { useLoginForm } from "../model/useLoginForm";
import { toastStore } from "@/shared/model/toastStore";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginForm: React.FC = () => {
  const nav = useNavigate();
  const {
    email,
    password,
    setEmail,
    setPassword,
    loading,
    error,
    canSubmit,
    submit,
  } = useLoginForm();

  // ✅ 인라인 검증 메시지(사용자가 즉시 이유를 알 수 있게)
  const emailError = useMemo(() => {
    if (!email) return "이메일을 입력해주세요.";
    if (!emailRegex.test(email.trim()))
      return "이메일 형식이 올바르지 않습니다.";
    return "";
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return "비밀번호를 입력해주세요.";
    return "";
  }, [password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ 눌렀는데 반응 없다는 느낌 방지: invalid면 즉시 토스트
    if (!canSubmit) {
      toastStore.push({
        type: "info",
        title: "입력 확인",
        message: "이메일과 비밀번호를 입력해주세요.",
      });
      return;
    }

    const ok = await submit();
    if (ok) nav("/");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <TextField
        label="이메일"
        value={email}
        onChange={setEmail}
        placeholder="이메일을 입력해주세요 (예: name@example.com)"
        type="email"
        autoComplete="email"
        errorText={email ? emailError : ""} // 입력 시작하면 즉시 안내
      />

      <TextField
        label="비밀번호"
        value={password}
        onChange={setPassword}
        placeholder="비밀번호를 입력해주세요"
        type="password"
        autoComplete="current-password"
        errorText={password ? passwordError : ""}
      />

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading} full>
        {loading ? "로그인 중..." : "로그인"}
      </Button>

      <Button
        type="button"
        full
        className="bg-slate-500 text-white hover:bg-slate-600"
        onClick={() => nav("/signup")}
        disabled={loading}
      >
        회원가입
      </Button>
    </form>
  );
};

export default LoginForm;
