import React from "react";
import { SignUpForm } from "@/features/auth/sign-up";

const SignupPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <h1 className="text-3xl font-extrabold text-slate-900">회원가입</h1>
        <p className="mt-2 text-slate-600">
          계정을 생성하면 AI 기능을 사용할 수 있습니다.
        </p>

        <div className="mt-8">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
