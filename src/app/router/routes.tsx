import { RouteObject } from "react-router-dom";
import { Home } from "@/pages/home";
// import { Login } from "@/pages/auth/login";

export const routes: RouteObject[] = [
  { path: "/", element: <Home /> },
  // { path: "/login", element: <Login /> },
];
