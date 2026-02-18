import React, { useEffect, useMemo, useState } from "react";
import {
  productSourcingApi,
  serverSummaryToRow,
} from "@/entities/sourcing-product";
import type { SourcingProductRow } from "@/entities/sourcing-product";
import { Modal } from "@/shared/ui";

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (row: SourcingProductRow) => void;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function formatYmdLocal(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function startOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function buildDefaultRangeIso() {
  const now = new Date();
  const to = endOfDayLocal(now).toISOString();

  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - 14);
  const from = startOfDayLocal(fromDate).toISOString();

  return { from, to };
}

function Thumb({ url }: { url?: string }) {
  const src = (url ?? "").trim();
  if (!src) {
    return (
      <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200" />
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="h-10 w-10 rounded-xl object-cover border border-slate-200 bg-white"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

export const SourcingPickerModal: React.FC<Props> = ({
  open,
  onClose,
  onPick,
}) => {
  const [keyword, setKeyword] = useState("");
  const [vendor, setVendor] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<SourcingProductRow[]>([]);

  const filtered = useMemo(() => {
    const k = keyword.trim();
    const v = vendor.trim();
    return rows.filter((r) => {
      if (k && !r.keyword.includes(k) && !r.productName.includes(k))
        return false;
      if (v && !r.vendor.includes(v)) return false;
      return true;
    });
  }, [rows, keyword, vendor]);

  useEffect(() => {
    if (!open) return;

    const run = async () => {
      setLoading(true);
      try {
        const { from, to } = buildDefaultRangeIso();
        const res = await productSourcingApi.getSummaryCursor({
          from,
          to,
          size: 50,
        });
        setRows((res.items ?? []).map(serverSummaryToRow));
      } finally {
        setLoading(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    run();
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="소싱 목록에서 불러오기"
      description="저장된 소싱 항목을 선택하면, 해당 소싱 ID 기준으로 중국 사입 계산기를 불러옵니다."
      widthClassName="max-w-[1100px]"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <div className="text-xs font-bold text-slate-600">
              키워드/상품명
            </div>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400"
              placeholder="예: 필통"
            />
          </label>
          <label className="block">
            <div className="text-xs font-bold text-slate-600">도매처</div>
            <input
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400"
              placeholder="예: 1688"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 flex items-center justify-between">
            <div>
              최근 2주 소싱 · {filtered.length.toLocaleString()}건
              {loading ? " (불러오는 중...)" : ""}
            </div>
            <button
              type="button"
              className="h-9 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              onClick={onClose}
            >
              닫기
            </button>
          </div>

          <div className="max-h-[520px] overflow-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                표시할 항목이 없습니다.
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {filtered.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3"
                      onClick={() => onPick(r)}
                    >
                      <Thumb url={r.imageUrl} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-black text-slate-900 truncate">
                            {r.keyword || "(키워드 없음)"}
                          </div>
                          <div className="text-xs font-semibold text-slate-500 truncate">
                            {r.vendor || ""}
                          </div>
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-600 truncate">
                          {r.productName || "(상품명 없음)"}
                        </div>
                      </div>

                      <div className="shrink-0 text-xs font-mono text-slate-500">
                        {r.serverId ?? r.id}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
