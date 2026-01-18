import React, { useEffect, useRef, useState } from "react";
import { RecentPagesMenu } from "@/features/recent-pages/ui/RecentPagesMenu";
import { getRecentPages } from "@/features/recent-pages/model/recentPages";

export type AppMenuKey = "detail" | "thumbnail";
type MenuItem = { key: AppMenuKey; label: string };

type Props = {
  isAuthed: boolean;
  welcomeText?: string;
  active: AppMenuKey;
  onSelect: (key: AppMenuKey) => void;
  onLogout: () => void;

  brandTitle?: string;
  brandTag?: string;
  menuItems?: MenuItem[];
};

const DEFAULT_MENU: MenuItem[] = [
  { key: "detail", label: "상세페이지 제작" },
  { key: "thumbnail", label: "썸네일 제작" },
];

const Header: React.FC<Props> = ({
  isAuthed,
  welcomeText = "게스트님 환영합니다",
  active,
  onSelect,
  onLogout,
  brandTitle = "Seller AI Club",
  brandTag = "AI SELLER TOOLKIT",
  menuItems = DEFAULT_MENU,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);

  // ✅ recent count badge
  const [recentCount, setRecentCount] = useState(0);

  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setUserOpen(false);
        setRecentOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ✅ 메뉴 열릴 때 최근 목록 개수 동기화
  useEffect(() => {
    if (recentOpen) {
      setRecentCount(getRecentPages().length);
    }
  }, [recentOpen]);

  const statusDotCls = isAuthed
    ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]"
    : "bg-slate-300 shadow-[0_0_0_4px_rgba(148,163,184,0.18)]";

  return (
    <header className="sticky top-0 z-[100] border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <div
        ref={wrapRef}
        className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4"
      >
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 rounded-2xl bg-slate-900 shadow-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 via-sky-400/30 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center text-white font-black tracking-tight">
              <span className="text-lg">S</span>
            </div>
            <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-sky-400 rounded-full ring-2 ring-white" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg md:text-xl font-black text-slate-900 leading-none truncate">
                {brandTitle}
              </h1>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Beta
              </span>
            </div>
            <p className="text-[10px] font-extrabold text-slate-500 tracking-[0.22em] uppercase mt-1 truncate">
              {brandTag}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 relative">
          {/* Welcome + status dot */}
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              aria-label="auth-status"
              onClick={() => {
                if (!isAuthed) return;
                setUserOpen((v) => !v);
                setMenuOpen(false);
                setRecentOpen(false);
              }}
              className={[
                "w-3.5 h-3.5 rounded-full transition",
                statusDotCls,
                isAuthed ? "cursor-pointer" : "cursor-default",
              ].join(" ")}
              title={isAuthed ? "로그인됨" : "비로그인"}
            />

            <span className="hidden md:inline text-sm font-semibold text-slate-700">
              {welcomeText}
            </span>

            {userOpen && isAuthed && (
              <div className="absolute right-0 top-10 w-[220px] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-sm font-extrabold text-slate-900">
                    로그인 상태
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    세션을 종료할 수 있습니다
                  </div>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUserOpen(false);
                      onLogout();
                    }}
                    className={[
                      "w-full px-3 py-3 rounded-xl font-extrabold",
                      "bg-slate-900 text-white hover:bg-slate-950 transition",
                      "shadow-md",
                    ].join(" ")}
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ✅ Recent button (Option A) */}
          <div className="relative">
            <button
              type="button"
              aria-label="recent"
              title="최근 접속"
              onClick={() => {
                setRecentOpen((v) => !v);
                setMenuOpen(false);
                setUserOpen(false);
              }}
              className={[
                "inline-flex items-center gap-2 px-3 py-2 rounded-2xl",
                "bg-white border border-slate-200 shadow-sm",
                "hover:bg-slate-50 transition",
                recentOpen ? "ring-2 ring-blue-200 border-blue-200" : "",
              ].join(" ")}
            >
              {/* clock icon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="text-slate-700"
              >
                <path
                  d="M12 8v5l3 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>

              {/* label (desktop only) */}
              <span className="hidden md:inline text-sm font-extrabold text-slate-800">
                최근
              </span>

              {/* count badge */}
              {recentCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-black bg-blue-600 text-white">
                  {recentCount > 9 ? "9+" : recentCount}
                </span>
              )}
            </button>

            {recentOpen && (
              <div className="absolute right-0 top-12 w-[320px] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                <RecentPagesMenu
                  onSelect={(key) => {
                    onSelect(key as AppMenuKey);
                    setRecentOpen(false);
                  }}
                  onClose={() => setRecentOpen(false)}
                  onChanged={(items) => setRecentCount(items.length)} // ✅ 핵심
                />
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button
            type="button"
            aria-label="menu"
            onClick={() => {
              setMenuOpen((v) => !v);
              setUserOpen(false);
              setRecentOpen(false);
            }}
            className="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-slate-100 border border-slate-200 hover:bg-slate-200 transition"
          >
            <div className="w-5 h-5 relative">
              <span
                className={[
                  "absolute left-0 top-[4px] h-[2px] w-5 bg-slate-800 rounded transition",
                  menuOpen ? "translate-y-[6px] rotate-45" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute left-0 top-[10px] h-[2px] w-5 bg-slate-800 rounded transition",
                  menuOpen ? "opacity-0" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute left-0 top-[16px] h-[2px] w-5 bg-slate-800 rounded transition",
                  menuOpen ? "translate-y-[-6px] -rotate-45" : "",
                ].join(" ")}
              />
            </div>
          </button>

          {/* Menu dropdown (only main menu) */}
          {menuOpen && (
            <div className="absolute right-0 top-12 w-[260px] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
              <div className="md:hidden px-4 py-3 border-b border-slate-100">
                <div className="text-sm font-bold text-slate-900 truncate">
                  {welcomeText}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  메뉴를 선택해 화면을 전환하세요
                </div>
              </div>

              <div className="p-2">
                {menuItems.map((m) => {
                  const selected = m.key === active;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => {
                        onSelect(m.key);
                        setMenuOpen(false);
                      }}
                      className={[
                        "w-full text-left px-3 py-3 rounded-xl transition flex items-center justify-between",
                        selected
                          ? "bg-blue-600 text-white"
                          : "bg-white text-slate-800 hover:bg-slate-100",
                      ].join(" ")}
                    >
                      <span className="font-extrabold text-sm">{m.label}</span>
                      {selected && (
                        <span className="text-[10px] font-black opacity-90">
                          선택됨
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
