import React from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES, ROUTE_LABEL } from "@/app/router/paths";
import { pushRecentPage } from "@/features/recent-pages/model/recentPages";

type Card = {
  title: string;
  desc: string;
  to: string;
  bullets: string[];
  accent: "blue" | "violet" | "emerald" | "amber";
};

const cards: Card[] = [
  {
    title: "소싱",
    desc: "상품 후보 수집과 원가·마진 계산을 빠르게",
    to: ROUTES.SOURCING_PRODUCTS,
    bullets: ["상품 소싱", "중국 사입 계산"],
    accent: "blue",
  },
  {
    title: "기획",
    desc: "전환 중심 상세/썸네일 생성 플로우",
    to: ROUTES.PLANNING_DETAIL_PAGE,
    bullets: ["상세페이지 생성/예약", "썸네일 생성/예약"],
    accent: "violet",
  },
  {
    title: "상품",
    desc: "등록 자산 관리와 결과물 조회",
    to: ROUTES.PRODUCTS_MANAGE,
    bullets: ["등록 상품 관리", "상세페이지 조회", "썸네일 조회"],
    accent: "emerald",
  },
  {
    title: "마이페이지",
    desc: "계정 보안 설정",
    to: ROUTES.MY_PASSWORD,
    bullets: ["비밀번호 변경"],
    accent: "amber",
  },
];

function accentClasses(accent: Card["accent"]) {
  switch (accent) {
    case "blue":
      return {
        ring: "group-hover:ring-blue-200",
        badge: "bg-blue-600 text-white",
        dot: "bg-blue-500",
        glowA: "from-blue-200/70",
        glowB: "to-sky-200/50",
        border: "group-hover:border-blue-200",
        shimmer: "via-blue-200/90",
      };
    case "violet":
      return {
        ring: "group-hover:ring-violet-200",
        badge: "bg-violet-600 text-white",
        dot: "bg-violet-500",
        glowA: "from-violet-200/70",
        glowB: "to-fuchsia-200/50",
        border: "group-hover:border-violet-200",
        shimmer: "via-violet-200/90",
      };
    case "emerald":
      return {
        ring: "group-hover:ring-emerald-200",
        badge: "bg-emerald-600 text-white",
        dot: "bg-emerald-500",
        glowA: "from-emerald-200/70",
        glowB: "to-teal-200/50",
        border: "group-hover:border-emerald-200",
        shimmer: "via-emerald-200/90",
      };
    case "amber":
      return {
        ring: "group-hover:ring-amber-200",
        badge: "bg-amber-600 text-white",
        dot: "bg-amber-500",
        glowA: "from-amber-200/70",
        glowB: "to-orange-200/50",
        border: "group-hover:border-amber-200",
        shimmer: "via-amber-200/90",
      };
  }
}

const HomePage: React.FC = () => {
  const nav = useNavigate();

  const go = (to: string) => {
    pushRecentPage(to, ROUTE_LABEL[to] ?? to);
    nav(to);
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        {/* subtle gradient mesh */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-200/50 blur-3xl" />
          <div className="absolute left-1/2 -top-28 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-200/45 blur-3xl" />
          <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/70 to-white" />
        </div>

        <div className="relative">
          <h2 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-slate-900">
            소싱 → 기획 → 상품 관리까지
            <br className="hidden md:block" />
            판매 전환을 빠르게 실행하세요
          </h2>

          <p className="mt-3 max-w-2xl text-sm md:text-base font-medium text-slate-600">
            과장/허위/의료 효능 단정은 배제하고, 실제 쿠팡에서 “팔릴 수 있는”
            콘텐츠만 생성합니다.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {/* ✅ CTA button hover micro-interaction */}
            <button
              type="button"
              onClick={() => go(ROUTES.PLANNING_DETAIL_PAGE)}
              className={[
                "ml-auto group/cta relative inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5",
                "text-sm font-extrabold text-white shadow-md transition",
                "hover:bg-slate-950 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
                "focus:outline-none focus:ring-4 focus:ring-blue-200",
                "overflow-hidden",
              ].join(" ")}
            >
              {/* highlight sweep */}
              <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover/cta:opacity-100">
                <span className="absolute -left-1/3 top-0 h-full w-1/2 skew-x-[-20deg] bg-gradient-to-r from-white/0 via-white/18 to-white/0 animate-[ctaSweep_1.2s_ease-in-out_infinite]" />
              </span>

              <span className="relative">바로 시작하기</span>
              <span className="relative text-white/80 transition-transform group-hover/cta:translate-x-0.5">
                →
              </span>

              {/* keyframes via tailwind arbitrary */}
              <style>{`
                @keyframes ctaSweep {
                  0% { transform: translateX(-60%) skewX(-20deg); opacity: 0; }
                  20% { opacity: 1; }
                  100% { transform: translateX(220%) skewX(-20deg); opacity: 0; }
                }
              `}</style>
            </button>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => {
          const a = accentClasses(c.accent);
          return (
            <button
              key={c.title}
              type="button"
              onClick={() => go(c.to)}
              className={[
                "group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 text-left shadow-sm",
                "transition-transform hover:-translate-y-0.5 hover:shadow-md",
                "ring-0 hover:ring-4",
                a.ring,
                a.border,
              ].join(" ")}
            >
              {/* accent glow */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                <div
                  className={[
                    "absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl",
                    "bg-gradient-to-br",
                    a.glowA,
                    a.glowB,
                  ].join(" ")}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/30 to-white/70" />
              </div>

              {/* ✅ micro animation target wrapper */}
              <div className="relative transition-transform duration-300 group-hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          "inline-flex h-2 w-2 rounded-full",
                          a.dot,
                        ].join(" ")}
                      />
                      <div className="text-lg font-black text-slate-900">
                        {c.title}
                      </div>

                      {/* ✅ badge shimmer */}
                      <span
                        className={[
                          "relative ml-1 rounded-full px-2 py-0.5 text-[11px] font-black",
                          a.badge,
                          "overflow-hidden",
                        ].join(" ")}
                      >
                        <span className="relative z-10">STEP</span>
                        <span
                          className={[
                            "pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100",
                            "bg-gradient-to-r from-white/0",
                            a.shimmer,
                            "to-white/0",
                            "animate-[badgeShimmer_1.1s_ease-in-out_infinite]",
                          ].join(" ")}
                        />
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-slate-600 font-medium transition-transform duration-300 group-hover:-translate-y-[1px]">
                      {c.desc}
                    </div>
                  </div>

                  {/* ✅ right chip shift */}
                  <div className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-extrabold text-slate-700 backdrop-blur transition-transform duration-300 group-hover:translate-x-0.5">
                    이동 →
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {c.bullets.map((b) => (
                    <div
                      key={b}
                      className="flex items-center gap-2 text-sm text-slate-800 transition-transform duration-300 group-hover:-translate-y-[1px]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span className="font-semibold">{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <style>{`
                @keyframes badgeShimmer {
                  0% { transform: translateX(-120%); opacity: 0; }
                  20% { opacity: 1; }
                  100% { transform: translateX(120%); opacity: 0; }
                }
              `}</style>
            </button>
          );
        })}
      </section>

      {/* footer note */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-extrabold text-slate-900">
              추천 플로우
            </div>
            <div className="mt-1 text-sm text-slate-600 font-medium">
              소싱에서 원가/마진을 잡고 → 기획에서 상세/썸네일 생성 → 상품에서
              결과물 확인
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => go(ROUTES.SOURCING_PRODUCTS)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-extrabold text-slate-800 hover:bg-slate-100 transition"
            >
              소싱부터
            </button>
            <button
              type="button"
              onClick={() => go(ROUTES.PLANNING_THUMBNAIL)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-extrabold text-slate-800 hover:bg-slate-100 transition"
            >
              썸네일부터
            </button>
            <button
              type="button"
              onClick={() => go(ROUTES.PRODUCTS_MANAGE)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-extrabold text-slate-800 hover:bg-slate-100 transition"
            >
              상품관리로
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
