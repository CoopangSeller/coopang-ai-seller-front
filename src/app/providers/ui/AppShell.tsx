import React from "react";
import { Outlet } from "react-router-dom";
import { useGlobalLoading } from "@/shared/model/globalLoading";
import FullScreenSpinner from "@/shared/ui/spinner/FullScreenSpinner";
import ToastHost from "@/shared/ui/toast/ToastHost";
import { useSession } from "@/entities/session/model/sessionStore";

import { Header, Footer } from "@/widgets/layout";

const AppShell: React.FC = () => {
  const loading = useGlobalLoading();

  const { accessToken } = useSession();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      <ToastHost />
      {loading && <FullScreenSpinner />}

      {accessToken && <Header />}

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>

      {accessToken && <Footer />}
    </div>
  );
};

export default AppShell;
