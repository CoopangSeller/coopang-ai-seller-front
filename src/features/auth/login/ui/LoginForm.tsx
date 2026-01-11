import React from "react";
import { useNavigate } from "react-router-dom";
import { useLoginForm } from "../model/useLoginForm";
import { TextField } from "@/shared/ui/input/";
import { Button } from "@/shared/ui/button/";

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submit();
    if (ok) nav("/");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <TextField
        label="이메일"
        value={email}
        onChange={setEmail}
        placeholder="name@example.com"
        type="email"
        autoComplete="email"
      />

      <TextField
        label="비밀번호"
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
        type="password"
        autoComplete="current-password"
      />

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <Button type="submit" disabled={!canSubmit || loading} full>
        {loading ? "로그인 중..." : "로그인"}
      </Button>

      <button
        type="button"
        onClick={() => nav("/")}
        className="w-full text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        홈으로 돌아가기
      </button>
    </form>
  );
};

export default LoginForm;
