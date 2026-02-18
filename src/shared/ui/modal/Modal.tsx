import React, { useEffect } from "react";

function isEditableElement(el: Element | null) {
  return !!el?.closest("input, textarea, select, button, a");
}

export type ModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  widthClassName?: string;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * 프로젝트 내 공통 모달(외부 UI 라이브러리 의존 없음)
 * - ESC 닫기
 * - backdrop 클릭 닫기
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  description,
  widthClassName = "max-w-[980px]",
  onClose,
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (isEditableElement(document.activeElement)) return;
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[500]">
      <div className="absolute inset-0 bg-black/30" onMouseDown={onClose} />
      <div className="absolute inset-0 flex items-start justify-center overflow-auto p-6">
        <div
          className={[
            "w-full",
            widthClassName,
            "rounded-3xl border border-slate-200 bg-white shadow-2xl",
          ].join(" ")}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {(title || description) && (
            <div className="border-b border-slate-200 px-6 py-5">
              {title ? (
                <div className="text-base font-black text-slate-900">
                  {title}
                </div>
              ) : null}
              {description ? (
                <div className="mt-1 text-sm font-medium text-slate-600">
                  {description}
                </div>
              ) : null}
            </div>
          )}

          <div className="px-6 py-6">{children}</div>
        </div>
      </div>
    </div>
  );
};
