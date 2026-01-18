import React, { useEffect, useMemo, useState } from "react";
import {
  clearRecentPages,
  getRecentPages,
  RecentPage,
} from "../model/recentPages";

type Props = {
  onSelect: (key: string) => void;
  onClose: () => void;

  /** ✅ 최근 목록 변경(삭제/전체삭제 등) 시 Header가 뱃지 갱신할 수 있도록 */
  onChanged?: (items: RecentPage[]) => void;
};

const LABEL: Record<string, string> = {
  detail: "상세페이지 제작",
  thumbnail: "썸네일 제작",
};

export const RecentPagesMenu: React.FC<Props> = ({
  onSelect,
  onClose,
  onChanged,
}) => {
  const [items, setItems] = useState<RecentPage[]>([]);

  // 메뉴 열릴 때마다 최신 로드
  useEffect(() => {
    const loaded = getRecentPages();
    setItems(loaded);
    onChanged?.(loaded);
  }, [onChanged]);

  const pretty = useMemo(() => {
    return items.map((it) => ({
      ...it,
      label: it.label ?? LABEL[it.key] ?? it.key,
    }));
  }, [items]);

  const handleClearAll = () => {
    clearRecentPages();
    setItems([]);
    onChanged?.([]);
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between px-2 pb-2">
        <div className="text-xs font-black text-slate-500 uppercase tracking-wide">
          최근 접속
        </div>

        <button
          type="button"
          onClick={handleClearAll}
          className="text-xs font-extrabold text-slate-500 hover:text-slate-800 transition"
        >
          전체 삭제
        </button>
      </div>

      {pretty.length === 0 ? (
        <div className="px-2 py-3 text-sm text-slate-400">
          최근 기록이 없습니다.
        </div>
      ) : (
        <div className="space-y-2">
          {pretty.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                onSelect(p.key);
                onClose();
              }}
              className="w-full text-left px-3 py-3 rounded-xl bg-white text-slate-800 hover:bg-slate-100 transition"
            >
              <div className="text-sm font-extrabold">{p.label}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {new Date(p.visitedAt).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
