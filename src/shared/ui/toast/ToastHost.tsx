import React from "react";
import { toastStore, useToasts } from "@/shared/model/toastStore";

const ToastHost: React.FC = () => {
  const toasts = useToasts();

  const cls = (type: string) => {
    if (type === "success") return "bg-emerald-600";
    if (type === "error") return "bg-red-600";
    return "bg-slate-800";
  };

  return (
    <div className="fixed z-[9999] top-4 right-4 space-y-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${cls(
            t.type
          )} text-white rounded-2xl shadow-xl px-4 py-3 w-[320px]`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {t.title && <div className="font-bold">{t.title}</div>}
              <div className="text-sm opacity-95 break-words">{t.message}</div>
            </div>
            <button
              className="text-white/90 hover:text-white font-bold"
              onClick={() => toastStore.remove(t.id)}
              aria-label="close"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastHost;
