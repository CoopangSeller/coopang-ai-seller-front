export function LoadingOverlay({
  show,
  label = "로딩 중...",
}: {
  show: boolean;
  label?: string;
}) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        <span className="text-sm text-slate-700">{label}</span>
      </div>
    </div>
  );
}
