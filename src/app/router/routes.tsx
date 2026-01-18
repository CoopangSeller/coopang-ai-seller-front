import React from "react";
import { createBrowserRouter } from "react-router-dom";

import AuthGuard from "./guards/AuthGuard";
import { HomePage } from "@/pages/home";
import { LoginPage } from "@/pages/auth/login";
import { SignUpPage } from "@/pages/auth/sign-up";
import AppShell from "../providers/ui/AppShell";
import { flags } from "@/shared/config/flags";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      // ✅ authEnabled=false면 로그인/회원가입 라우트 자체를 홈으로 리다이렉트
      {
        path: "/login",
        element: flags.apiEnabled ? <LoginPage /> : <HomePage />,
      },
      {
        path: "/signup",
        element: flags.apiEnabled ? <SignUpPage /> : <HomePage />,
      },

      // 보호 영역
      ...(flags.apiEnabled
        ? [
            {
              element: <AuthGuard />,
              children: [{ path: "/", element: <HomePage /> }],
            },
          ]
        : [
            {
              path: "/",
              element: <HomePage />,
            },
          ]),

      // 기타 라우트가 있으면 여기에 추가
      // { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
