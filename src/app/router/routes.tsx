import React from "react";
import { createBrowserRouter } from "react-router-dom";

import AuthGuard from "./guards/AuthGuard";
import { HomePage } from "@/pages/home";
import { LoginPage } from "@/pages/auth/login";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },

  {
    element: <AuthGuard />,
    children: [{ path: "/", element: <HomePage /> }],
  },
]);
