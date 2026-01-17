import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TextField } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { useSignupForm } from "../model/useSingUpForm";
import { toastStore } from "@/shared/model/toastStore";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SignupForm: React.FC = () => {
  const nav = useNavigate();
  const {
    username,
    email,
    password,
    agreedTerms,
    agreedPrivacy,
    setUsername,
    setEmail,
    setPassword,
    setAgreedTerms,
    setAgreedPrivacy,
    loading,
    error,
    canSubmit,
    submit,
  } = useSignupForm();

  const usernameError = useMemo(
    () => (!username ? "이름을 입력해주세요." : ""),
    [username]
  );

  const emailError = useMemo(() => {
    if (!email) return "이메일을 입력해주세요.";
    if (!emailRegex.test(email.trim()))
      return "이메일 형식이 올바르지 않습니다.";
    return "";
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return "비밀번호를 입력해주세요.";
    if (password.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
    return "";
  }, [password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      toastStore.push({
        type: "info",
        title: "입력 확인",
        message: "입력값과 필수 약관 동의를 확인해주세요.",
      });
      return;
    }

    const ok = await submit();
    if (ok) nav("/");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <TextField
        label="이름"
        value={username}
        onChange={setUsername}
        placeholder="이름을 입력해주세요"
        autoComplete="name"
        errorText={username ? usernameError : ""}
      />

      <TextField
        label="이메일"
        value={email}
        onChange={setEmail}
        placeholder="이메일을 입력해주세요 (예: name@example.com)"
        type="email"
        autoComplete="email"
        errorText={email ? emailError : ""}
      />

      <TextField
        label="비밀번호"
        value={password}
        onChange={setPassword}
        placeholder="비밀번호를 입력해주세요 (8자 이상)"
        type="password"
        autoComplete="new-password"
        errorText={password ? passwordError : ""}
        helperText={!password ? "영문/숫자/특수문자 조합 권장" : undefined}
      />

      <div className="pt-2 space-y-3">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
            className="w-5 h-5 rounded text-blue-600"
          />
          <span className="text-sm">이용 약관 동의 (필수)</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={agreedPrivacy}
            onChange={(e) => setAgreedPrivacy(e.target.checked)}
            className="w-5 h-5 rounded text-blue-600"
          />
          <span className="text-sm">개인정보 처리방침 동의 (필수)</span>
        </label>

        {!agreedTerms || !agreedPrivacy ? (
          <div className="text-xs text-slate-500">
            필수 약관에 동의해야 회원가입이 가능합니다.
          </div>
        ) : null}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <Button type="submit" full disabled={loading}>
        {loading ? "가입 중..." : "회원가입"}
      </Button>

      <Button
        type="button"
        full
        className="bg-slate-500 text-white hover:bg-slate-600"
        onClick={() => nav("/login")}
        disabled={loading}
      >
        로그인으로
      </Button>
    </form>
  );
};

export default SignupForm;
