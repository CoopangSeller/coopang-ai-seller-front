import React from "react";
import { LoginForm } from "@/features/auth/login";

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-slate-900">로그인</h1>
            <p className="text-sm text-slate-500 mt-2">
              AI 기능을 사용하려면 로그인이 필요합니다.
            </p>
          </div>

          <LoginForm />
        </div>

        <div className="mt-4 text-center text-xs text-slate-400">
          © 2025 HW CASE
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
