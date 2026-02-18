import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { session, useSession } from "@/entities/session/model/sessionStore";
import { clearDraftsAndUiCacheExceptAuth } from "@/shared/lib/storage/clearAppStorageExceptAuth";

import { ROUTES, ROUTE_LABEL } from "@/shared/config/routerPaths";
import { RecentPagesMenu } from "@/features/recent-pages/ui/RecentPagesMenu";
import {
  getRecentPages,
  pushRecentPage,
} from "@/features/recent-pages/model/recentPages";

type MenuGroupKey = "sourcing" | "planning" | "products" | "my";

type MenuItem = {
  label: string;
  to: string;
};

type MenuGroup = {
  key: MenuGroupKey;
  title: string;
  items: MenuItem[];
  pinned?: string[]; // to(경로) 기준으로 상단 고정할 항목들
};

const GROUPS: MenuGroup[] = [
  {
    key: "sourcing",
    title: "소싱",
    items: [
      { label: "상품 소싱", to: ROUTES.SOURCING_PRODUCTS },
      { label: "중국 사입 계산", to: ROUTES.SOURCING_CHINA_CALC },
    ],
  },
  {
    key: "planning",
    title: "기획",
    pinned: [ROUTES.PLANNING_DETAIL_PAGE, ROUTES.PLANNING_THUMBNAIL],
    items: [
      { label: "상세페이지 생성", to: ROUTES.PLANNING_DETAIL_PAGE },
      {
        label: "상세페이지 예약 생성",
        to: ROUTES.PLANNING_DETAIL_PAGE_SCHEDULED,
      },
      { label: "썸네일 생성", to: ROUTES.PLANNING_THUMBNAIL },
      { label: "썸네일 예약 생성", to: ROUTES.PLANNING_THUMBNAIL_SCHEDULED },
      { label: "태그 생성", to: ROUTES.PLANNING_TAG_GENERATOR },
    ],
  },
  {
    key: "products",
    title: "상품",
    items: [
      { label: "등록 상품 관리", to: ROUTES.PRODUCTS_MANAGE },
      { label: "상세페이지 조회", to: ROUTES.PRODUCTS_DETAIL_PAGES },
      { label: "썸네일 조회", to: ROUTES.PRODUCTS_THUMBNAILS },
    ],
  },
  {
    key: "my",
    title: "마이페이지",
    items: [{ label: "비밀번호 변경", to: ROUTES.MY_PASSWORD }],
  },
];

function groupKeyByPath(pathname: string): MenuGroupKey | null {
  if (pathname.startsWith("/sourcing")) return "sourcing";
  if (pathname.startsWith("/planning")) return "planning";
  if (pathname.startsWith("/products")) return "products";
  if (pathname.startsWith("/my")) return "my";
  return null;
}

function dropdownWidthByGroup(key: MenuGroupKey): number {
  // 기획은 항목이 길고 많아서 넓게, 나머지는 적당히
  if (key === "planning") return 340;
  if (key === "products") return 300;
  if (key === "sourcing") return 280;
  return 260;
}

function splitPinned(group: MenuGroup) {
  const pinnedSet = new Set(group.pinned ?? []);
  const pinned = group.items.filter((it) => pinnedSet.has(it.to));
  const rest = group.items.filter((it) => !pinnedSet.has(it.to));
  return { pinned, rest };
}

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { accessToken, username } = useSession();
  const isAuthed = !!accessToken;

  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [recentCount, setRecentCount] = useState(0);

  // desktop dropdown
  const [openGroup, setOpenGroup] = useState<MenuGroupKey | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  // keyboard nav state (for dropdown)
  const [focusIndex, setFocusIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const activeGroup = useMemo(() => groupKeyByPath(pathname), [pathname]);

  const openGroupObj = useMemo(() => {
    if (!openGroup) return null;
    return GROUPS.find((g) => g.key === openGroup) ?? null;
  }, [openGroup]);

  const flatItemsForOpenGroup = useMemo(() => {
    if (!openGroupObj) return [];
    const { pinned, rest } = splitPinned(openGroupObj);
    const list: MenuItem[] = [];
    list.push(...pinned);
    list.push(...rest);
    return list;
  }, [openGroupObj]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
        setRecentOpen(false);
        setUserOpen(false);
        setOpenGroup(null);
        setFocusIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (recentOpen) setRecentCount(getRecentPages().length);
  }, [recentOpen]);

  useEffect(() => {
    // 라우트 이동 시 정리
    setMobileOpen(false);
    setOpenGroup(null);
    setFocusIndex(-1);
  }, [pathname]);

  const go = (to: string, label?: string) => {
    pushRecentPage(to, label ?? ROUTE_LABEL[to] ?? to);
    navigate(to);
    setMobileOpen(false);
    setRecentOpen(false);
    setUserOpen(false);
    setOpenGroup(null);
    setFocusIndex(-1);
  };

  const onLogoClick = () => {
    clearDraftsAndUiCacheExceptAuth();
    go(ROUTES.HOME, "홈");
  };

  const onLogout = () => {
    session.clear();
    navigate(ROUTES.HOME);
  };

  const statusDotCls = isAuthed
    ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]"
    : "bg-slate-300 shadow-[0_0_0_4px_rgba(148,163,184,0.18)]";

  const scheduleClose = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setOpenGroup(null);
      setFocusIndex(-1);
    }, 120);
  };

  const cancelClose = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  };

  const groupButtonCls = (key: MenuGroupKey) => {
    const isActive = activeGroup === key;
    const isOpen = openGroup === key;
    return [
      "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-extrabold transition border",
      isActive || isOpen
        ? "bg-slate-900 text-white border-slate-900"
        : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50",
      "focus:outline-none focus:ring-2 focus:ring-blue-200",
    ].join(" ");
  };

  const openDropdown = (key: MenuGroupKey) => {
    setOpenGroup(key);
    setRecentOpen(false);
    setUserOpen(false);
    setFocusIndex(0); // 열릴 때 첫 항목 포커스 인덱스
    cancelClose();
    // 실제 DOM focus는 next tick에
    window.setTimeout(() => {
      dropdownRef.current?.focus();
    }, 0);
  };

  const closeDropdown = () => {
    setOpenGroup(null);
    setFocusIndex(-1);
  };

  // 키보드 네비게이션: ESC 닫기, ↑↓ 이동, Enter 선택
  const onDropdownKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!openGroupObj) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeDropdown();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIndex((prev) => {
        const next =
          prev < 0 ? 0 : Math.min(prev + 1, flatItemsForOpenGroup.length - 1);
        return next;
      });
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIndex((prev) => {
        const next = prev <= 0 ? 0 : prev - 1;
        return next;
      });
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItemsForOpenGroup[focusIndex];
      if (item) go(item.to, item.label);
      return;
    }
  };

  return (
    <header className="sticky top-0 z-[100] border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <div
        ref={wrapRef}
        className="w-full px-6 py-4 flex items-center justify-between gap-4"
      >
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            aria-label="home"
            onClick={onLogoClick}
            className="relative w-11 h-11 rounded-2xl bg-slate-900 shadow-lg overflow-hidden
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       transition-transform hover:scale-[1.03] active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 via-sky-400/30 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center text-white font-black tracking-tight">
              <span className="text-lg">A</span>
            </div>
            <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-sky-400 rounded-full ring-2 ring-white" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg md:text-xl font-black text-slate-900 leading-none truncate">
                AI Sync Club
              </h1>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Beta
              </span>
            </div>
            <p className="text-[10px] font-extrabold text-slate-500 tracking-[0.22em] uppercase mt-1 truncate">
              COUPANG SELLER TOOLKIT
            </p>
          </div>
        </div>

        {/* Desktop nav: right aligned */}
        <div className="hidden lg:flex flex-1 justify-end">
          <nav className="flex items-center gap-2 relative">
            {GROUPS.map((g) => (
              <div
                key={g.key}
                className="relative"
                onMouseEnter={() => openDropdown(g.key)}
                onMouseLeave={() => scheduleClose()}
              >
                <button
                  type="button"
                  className={groupButtonCls(g.key)}
                  aria-haspopup="menu"
                  aria-expanded={openGroup === g.key}
                  onClick={() => {
                    // 클릭 시 토글 + 키보드 활성화를 위해 focus도 이동
                    if (openGroup === g.key) {
                      closeDropdown();
                    } else {
                      openDropdown(g.key);
                    }
                  }}
                  onKeyDown={(e) => {
                    // 그룹 버튼에서 ↓를 누르면 드롭다운을 열고 첫 항목 포커스
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      openDropdown(g.key);
                    }
                    // ESC로 닫기
                    if (e.key === "Escape") {
                      e.preventDefault();
                      closeDropdown();
                    }
                  }}
                >
                  {g.title}
                </button>

                {openGroup === g.key && (
                  <div
                    className="absolute right-0 top-[46px] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
                    style={{ width: dropdownWidthByGroup(g.key) }}
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                    role="menu"
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="text-xs font-black text-slate-500 uppercase tracking-wide">
                        {g.title}
                      </div>
                      <div className="text-[12px] text-slate-500 mt-1">
                        {g.items.length}개의 메뉴
                      </div>
                    </div>

                    {/* key nav focus container */}
                    <div
                      ref={dropdownRef}
                      tabIndex={0}
                      onKeyDown={onDropdownKeyDown}
                      className="outline-none"
                    >
                      <div className="p-2">
                        {(() => {
                          const { pinned, rest } = splitPinned(g);
                          const pinnedExists = pinned.length > 0;

                          const renderItem = (it: MenuItem, idx: number) => {
                            const isPathActive = pathname === it.to;
                            const isFocused = idx === focusIndex;

                            return (
                              <button
                                key={it.to}
                                type="button"
                                onMouseEnter={() => setFocusIndex(idx)}
                                onClick={() => go(it.to, it.label)}
                                className={[
                                  "w-full text-left px-3 py-3 rounded-2xl transition border flex items-center justify-between",
                                  isPathActive
                                    ? "bg-slate-900 text-white border-slate-900"
                                    : "bg-white text-slate-800 border-transparent hover:bg-slate-50 hover:border-slate-200",
                                  isFocused ? "ring-2 ring-blue-200" : "",
                                ].join(" ")}
                              >
                                <div className="text-sm font-extrabold">
                                  {it.label}
                                </div>
                                <div className="text-xs opacity-70">↵</div>
                              </button>
                            );
                          };

                          const pinnedBlock: React.ReactNode[] = [];
                          let cursor = 0;

                          if (pinnedExists) {
                            pinnedBlock.push(
                              <div
                                key="pinnedLabel"
                                className="px-2 py-1 text-[11px] font-black text-slate-500"
                              >
                                자주 쓰는 메뉴
                              </div>,
                            );
                            pinned.forEach((it) => {
                              pinnedBlock.push(renderItem(it, cursor));
                              cursor += 1;
                            });
                            pinnedBlock.push(
                              <div
                                key="divider"
                                className="my-2 border-t border-slate-100"
                              />,
                            );
                          }

                          const restBlock = rest.map((it) => {
                            const node = renderItem(it, cursor);
                            cursor += 1;
                            return node;
                          });

                          return (
                            <>
                              {pinnedBlock}
                              {restBlock}
                            </>
                          );
                        })()}
                      </div>

                      <div className="px-4 pb-3 text-[11px] text-slate-400">
                        ↑↓ 이동 · Enter 선택 · ESC 닫기
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3 relative">
          {/* status + user */}
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              aria-label="auth-status"
              onClick={() => {
                if (!isAuthed) return;
                setUserOpen((v) => !v);
                setMobileOpen(false);
                setRecentOpen(false);
                setOpenGroup(null);
                setFocusIndex(-1);
              }}
              className={[
                "w-3.5 h-3.5 rounded-full transition",
                statusDotCls,
                isAuthed ? "cursor-pointer" : "cursor-default",
              ].join(" ")}
              title={isAuthed ? "로그인됨" : "비로그인"}
            />
            <span className="hidden md:inline text-sm font-semibold text-slate-700">
              {(username ?? "게스트") + "님 반가워요"}
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
                    className="w-full px-3 py-3 rounded-xl font-extrabold bg-slate-900 text-white hover:bg-slate-950 transition shadow-md"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* recent */}
          <div className="relative">
            <button
              type="button"
              aria-label="recent"
              title="최근 접속"
              onClick={() => {
                setRecentOpen((v) => !v);
                setMobileOpen(false);
                setUserOpen(false);
                setOpenGroup(null);
                setFocusIndex(-1);
              }}
              className={[
                "inline-flex items-center gap-2 px-3 py-2 rounded-2xl",
                "bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition",
                recentOpen ? "ring-2 ring-blue-200 border-blue-200" : "",
              ].join(" ")}
            >
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
              <span className="hidden md:inline text-sm font-extrabold text-slate-800">
                최근
              </span>
              {recentCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-black bg-blue-600 text-white">
                  {recentCount > 9 ? "9+" : recentCount}
                </span>
              )}
            </button>

            {recentOpen && (
              <div className="absolute right-0 top-12 w-[320px] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                <RecentPagesMenu
                  onSelect={(path) => go(path)}
                  onClose={() => setRecentOpen(false)}
                  onChanged={(items) => setRecentCount(items.length)}
                />
              </div>
            )}
          </div>

          {/* mobile menu */}
          <button
            type="button"
            aria-label="menu"
            onClick={() => {
              setMobileOpen((v) => !v);
              setUserOpen(false);
              setRecentOpen(false);
              setOpenGroup(null);
              setFocusIndex(-1);
            }}
            className="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-slate-100 border border-slate-200 hover:bg-slate-200 transition lg:hidden"
          >
            <div className="w-5 h-5 relative">
              <span
                className={[
                  "absolute left-0 top-[4px] h-[2px] w-5 bg-slate-800 rounded transition",
                  mobileOpen ? "translate-y-[6px] rotate-45" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute left-0 top-[10px] h-[2px] w-5 bg-slate-800 rounded transition",
                  mobileOpen ? "opacity-0" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute left-0 top-[16px] h-[2px] w-5 bg-slate-800 rounded transition",
                  mobileOpen ? "translate-y-[-6px] -rotate-45" : "",
                ].join(" ")}
              />
            </div>
          </button>

          {mobileOpen && (
            <div className="absolute right-0 top-12 w-[320px] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden lg:hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-sm font-extrabold text-slate-900 truncate">
                  {(username ?? "게스트") + "님"}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  메뉴를 선택해 이동하세요
                </div>
              </div>

              <div className="p-2 space-y-3">
                {GROUPS.map((g) => (
                  <div key={g.key}>
                    <div className="px-2 py-1 text-xs font-black text-slate-500">
                      {g.title}
                    </div>
                    <div className="space-y-2">
                      {g.items.map((it) => (
                        <button
                          key={it.to}
                          type="button"
                          onClick={() => go(it.to, it.label)}
                          className="w-full text-left px-3 py-3 rounded-xl bg-white text-slate-800 hover:bg-slate-100 transition border border-slate-200"
                        >
                          <div className="text-sm font-extrabold">
                            {it.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
