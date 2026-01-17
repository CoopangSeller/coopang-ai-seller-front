import React from "react";
import { Outlet } from "react-router-dom";
import { useGlobalLoading } from "@/shared/model/globalLoading";
import FullScreenSpinner from "@/shared/ui/spinner/FullScreenSpinner";
import ToastHost from "@/shared/ui/toast/ToastHost";

const AppShell: React.FC = () => {
  const loading = useGlobalLoading();

  return (
    <>
      <ToastHost />
      {loading && <FullScreenSpinner />}
      <Outlet />
    </>
  );
};

export default AppShell;
