import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
// import { isAdminAuthed } from "@/shared/session/adminSession";

const AuthGuard: React.FC = () => {
  const loc = useLocation();

  if (true) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return <Outlet />;
};

export default AuthGuard;
