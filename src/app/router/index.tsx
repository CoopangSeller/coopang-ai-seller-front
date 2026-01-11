import { useRoutes, BrowserRouter } from "react-router-dom";
import { routes } from "./routes";

const AppRouter = () => {
  const element = useRoutes(routes);
  return element;
};

export const RouterProvider = () => {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
};
