import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "@/entities/session/model/sessionStore";
import { useAuthBootstrap } from "@/features/auth/bootstrap/model/useAuthBootstrap";

const AuthGuard: React.FC = () => {
  const loc = useLocation();
  const { accessToken } = useSession();
  const { bootstrapped, bootstrapping } = useAuthBootstrap();

  // ✅ 부트스트랩 중이면 판단 보류 (여기서는 간단 로딩)
  if (!bootstrapped || bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return <Outlet />;
};

export default AuthGuard;
