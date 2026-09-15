import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { saveAs } from "file-saver";
import { ModelType } from "@/shared/types";
import { captureNodeToBlob } from "@/features/file/file-export/lib/capture";
import { ExportProgressOverlay } from "@/features/file/file-export";
import { DESIGN_STYLES } from "../api/detailPlannerGemini";
import { useDetailWorkspace, WorkspacePhase } from "../model/useDetailWorkspace";
import {
  DetailImageSegment,
  EvidenceLevel,
  PageLength,
  ProductKind,
  ProductResearch,
  SegmentLayout,
} from "../model/types";

const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ");
const DETAIL_PAGE_FONT =
  'Pretendard, "Noto Sans KR", "Malgun Gothic", Arial, sans-serif';

function UsageLine({ workspace: w }: { workspace: ReturnType<typeof useDetailWorkspace> }) {
  const usage = w.usageSummary;
  if (!usage.requestCount) return null;
  const cost = usage.estimatedCostUsd < 0.01
    ? usage.estimatedCostUsd.toFixed(4)
    : usage.estimatedCostUsd.toFixed(2);
  return (
    <p className="text-[11px] leading-5 text-stone-500">
      API {usage.requestCount}회 · 토큰 {usage.totalTokens.toLocaleString()} · 이미지 {usage.imageRequestCount}장
      {usage.webSearchCalls > 0 ? ` · 검색 ${usage.webSearchCalls}회` : ""} · 예상 ${cost}
    </p>
  );
}

const phaseIndex: Record<WorkspacePhase, number> = {
  input: 0,
  research: 1,
  plan: 2,
  result: 3,
};

const steps = [
  ["상품", "사진과 기본 정보"],
  ["소구점", "검색하고 직접 승인"],
  ["기획", "카피와 디자인 확인"],
  ["제작", "긴 화면 편집·저장"],
];

const kindOptions: Array<{ id: ProductKind; label: string; note: string }> = [
  { id: "food", label: "식품", note: "원물·가공·선물세트" },
  { id: "living", label: "생활용품", note: "주방·욕실·수납·청소" },
  { id: "other", label: "기타", note: "그 외 상품" },
];

const evidenceLabels: Record<EvidenceLevel, { label: string; className: string }> = {
  confirmed: { label: "입력·근거 확인", className: "bg-emerald-50 text-emerald-700" },
  general: { label: "일반 특성", className: "bg-sky-50 text-sky-700" },
  seller_check: { label: "판매자 확인 필요", className: "bg-amber-50 text-amber-800" },
};

function ProgressHeader({
  phase,
  onMove,
}: {
  phase: WorkspacePhase;
  onMove: (phase: WorkspacePhase) => void;
}) {
  const current = phaseIndex[phase];
  const phases: WorkspacePhase[] = ["input", "research", "plan", "result"];
  return (
    <div className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-1 text-xs font-bold tracking-[0.18em] text-[#8A2E26]">DETAIL STUDIO</p>
            <h1 className="text-2xl font-black tracking-[-0.04em] text-stone-950">
              구매 흐름부터 설계하는 상세페이지
            </h1>
          </div>
          <ol className="grid grid-cols-4 gap-1 sm:gap-2">
            {steps.map(([label, note], index) => (
              <li key={label}>
                <button
                  type="button"
                  disabled={index > current}
                  onClick={() => onMove(phases[index])}
                  className={cx(
                    "min-w-0 border-t-2 px-2 pt-3 text-left transition-colors sm:w-36",
                    index === current
                      ? "border-stone-950 text-stone-950"
                      : index < current
                        ? "border-[#8A2E26] text-stone-600 hover:text-stone-950"
                        : "cursor-not-allowed border-stone-200 text-stone-400",
                  )}
                >
                  <span className="block text-[11px] font-bold">0{index + 1}</span>
                  <span className="block text-sm font-extrabold">{label}</span>
                  <span className="hidden text-[11px] text-stone-400 sm:block">{note}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({
  children,
  optional,
}: {
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label className="mb-2 flex items-center gap-2 text-sm font-extrabold text-stone-800">
      {children}
      {optional && <span className="text-xs font-medium text-stone-400">선택</span>}
    </label>
  );
}

function InputPhase({ workspace: w }: { workspace: ReturnType<typeof useDetailWorkspace> }) {
  const photoHint =
    w.info.productKind === "living"
      ? "전체 모습 · 구조 · 디테일 · 사용 장면 · 구성품"
      : "패키지 앞면 · 실제 내용물 · 수량 구성 · 섭취 장면 · 질감";
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <p className="mb-2 text-sm font-extrabold text-[#8A2E26]">01 · 상품 입력</p>
        <h2 className="text-3xl font-black tracking-[-0.045em] text-stone-950 sm:text-4xl">
          상품 하나만 알려줘.
          <br />
          나머지는 AI가 조사할게.
        </h2>
        <p className="mt-4 text-sm leading-6 text-stone-500">
          사진은 없어도 되고, 있으면 3장이 가장 좋아. 가격·할인·판매자 브랜드는 결과 이미지에 넣지 않아.
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,.92fr)]">
        <section className="border border-stone-200 bg-white p-5 sm:p-8">
          <div className="mb-7">
            <FieldLabel>상품 종류</FieldLabel>
            <div className="grid grid-cols-3 border border-stone-200">
              {kindOptions.map((kind, index) => (
                <button
                  key={kind.id}
                  type="button"
                  onClick={() =>
                    w.setInfo((current) => ({ ...current, productKind: kind.id }))
                  }
                  className={cx(
                    "min-h-20 px-3 py-3 text-left transition-colors",
                    index > 0 && "border-l border-stone-200",
                    w.info.productKind === kind.id
                      ? "bg-stone-950 text-white"
                      : "bg-white text-stone-700 hover:bg-stone-50",
                  )}
                >
                  <span className="block text-sm font-black">{kind.label}</span>
                  <span
                    className={cx(
                      "mt-1 block text-[11px]",
                      w.info.productKind === kind.id ? "text-stone-300" : "text-stone-400",
                    )}
                  >
                    {kind.note}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <FieldLabel>상품명</FieldLabel>
              <input
                value={w.info.name}
                onChange={(event) =>
                  w.setInfo((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="예: 나주 신고배 선물세트"
                className="h-14 w-full border border-stone-300 bg-white px-4 text-base font-bold text-stone-950 outline-none transition focus:border-stone-950"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel optional>세부 카테고리</FieldLabel>
                <input
                  value={w.info.category}
                  onChange={(event) =>
                    w.setInfo((current) => ({ ...current, category: event.target.value }))
                  }
                  placeholder="예: 과일 선물세트"
                  className="h-12 w-full border border-stone-300 px-4 text-sm outline-none focus:border-stone-950"
                />
              </div>
              <div>
                <FieldLabel optional>공급사·참고 URL</FieldLabel>
                <input
                  value={w.info.sourceUrl}
                  onChange={(event) =>
                    w.setInfo((current) => ({ ...current, sourceUrl: event.target.value }))
                  }
                  placeholder="https://"
                  className="h-12 w-full border border-stone-300 px-4 text-sm outline-none focus:border-stone-950"
                />
              </div>
            </div>
            <div>
              <FieldLabel optional>유튜브 영상 자막</FieldLabel>
              <textarea
                value={w.info.videoTranscript ?? ""}
                maxLength={24000}
                onChange={(event) =>
                  w.setInfo((current) => ({
                    ...current,
                    videoTranscript: event.target.value,
                  }))
                }
                rows={6}
                placeholder="YouTube Summary의 ‘자막 복사’를 누른 뒤 여기에 Ctrl+V"
                className="w-full resize-y border border-stone-300 px-4 py-3 text-sm leading-6 outline-none focus:border-stone-950"
              />
              <div className="mt-2 flex items-start justify-between gap-4 text-xs text-stone-400">
                <p className="leading-5">
                  자막에서 상품 특징과 고객 표현을 찾고, 중요한 사실은 웹 자료와 교차 확인해.
                </p>
                <span className="shrink-0 font-mono">
                  {(w.info.videoTranscript ?? "").length.toLocaleString()}/24,000
                </span>
              </div>
            </div>
            <div>
              <FieldLabel optional>알고 있는 소구점</FieldLabel>
              <textarea
                value={w.info.features}
                onChange={(event) =>
                  w.setInfo((current) => ({ ...current, features: event.target.value }))
                }
                rows={4}
                placeholder={"예: 선물용 구성\n아삭한 식감\n산지 직송 여부는 확인 필요"}
                className="w-full resize-none border border-stone-300 px-4 py-3 text-sm leading-6 outline-none focus:border-stone-950"
              />
              <p className="mt-2 text-xs text-stone-400">확실하지 않은 내용은 그대로 적어도 돼. 다음 단계에서 구분해줄게.</p>
            </div>
            <div>
              <FieldLabel>기본 섹션 수</FieldLabel>
              <div className="grid grid-cols-4 border border-stone-200">
                {[
                  [PageLength.SHORT, "5장", "간결"],
                  [PageLength.STANDARD, "7장", "추천"],
                  [PageLength.LONG, "9장", "풍부"],
                  [PageLength.AUTO, "AI", "자동"],
                ].map(([value, label, note], index) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      w.setInfo((current) => ({ ...current, pageLength: value as PageLength }))
                    }
                    className={cx(
                      "h-16 text-center transition-colors",
                      index > 0 && "border-l border-stone-200",
                      w.info.pageLength === value
                        ? "bg-[#8A2E26] text-white"
                        : "bg-white text-stone-700 hover:bg-stone-50",
                    )}
                  >
                    <span className="block text-sm font-black">{label}</span>
                    <span
                      className={cx(
                        "text-[11px]",
                        w.info.pageLength === value ? "text-red-100" : "text-stone-400",
                      )}
                    >
                      {note}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="border border-stone-200 bg-[#F6F3ED] p-5 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <FieldLabel optional>상품 사진</FieldLabel>
              <p className="text-xs leading-5 text-stone-500">0~5장 · 권장 3장</p>
            </div>
            <span className="text-sm font-black text-stone-950">{w.photos.length}/5</span>
          </div>

          <label
            className={cx(
              "flex min-h-32 cursor-pointer flex-col items-center justify-center border border-dashed px-5 text-center transition-colors",
              w.photos.length >= 5
                ? "cursor-not-allowed border-stone-300 bg-stone-100 text-stone-400"
                : "border-stone-400 bg-white text-stone-700 hover:border-stone-950",
            )}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="mt-3 text-sm font-extrabold">사진 선택하기</span>
            <span className="mt-1 text-xs text-stone-400">JPG · PNG · WebP</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              disabled={w.photos.length >= 5}
              className="sr-only"
              onChange={(event) => {
                void w.addPhotoFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          <p className="mt-3 border-l-2 border-[#8A2E26] pl-3 text-xs leading-5 text-stone-500">
            {photoHint}
          </p>

          {w.photos.length > 0 && (
            <div className="mt-6 space-y-5">
              {w.photos.map((photo, index) => (
                <div key={photo.id} className="border-t border-stone-300 pt-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-stone-500">사진 {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => w.removePhoto(photo.id)}
                      className="text-xs font-bold text-stone-400 hover:text-red-700"
                    >
                      삭제
                    </button>
                  </div>
                  <div className={cx("grid gap-2", photo.cleaned ? "grid-cols-2" : "grid-cols-1")}>
                    <button
                      type="button"
                      onClick={() => w.selectPhotoVersion(photo.id, "original")}
                      className={cx(
                        "relative aspect-[4/3] overflow-hidden border bg-white",
                        photo.selected === "original" ? "border-stone-950" : "border-stone-200",
                      )}
                    >
                      <img src={photo.original} alt="원본" className="h-full w-full object-contain" />
                      <span className="absolute bottom-0 left-0 bg-white/90 px-2 py-1 text-[10px] font-bold">원본</span>
                    </button>
                    {photo.cleaned && (
                      <button
                        type="button"
                        onClick={() => w.selectPhotoVersion(photo.id, "cleaned")}
                        className={cx(
                          "relative aspect-[4/3] overflow-hidden border bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[length:16px_16px]",
                          photo.selected === "cleaned" ? "border-stone-950" : "border-stone-200",
                        )}
                      >
                        <img src={photo.cleaned} alt="정리 결과" className="h-full w-full object-contain" />
                        <span className="absolute bottom-0 left-0 bg-white/90 px-2 py-1 text-[10px] font-bold">정리본 ✓</span>
                      </button>
                    )}
                  </div>
                  {!photo.cleaned && (
                    <button
                      type="button"
                      disabled={photo.cleaning}
                      onClick={() => void w.cleanupPhoto(photo.id)}
                      className="mt-3 w-full border border-stone-300 bg-white py-2.5 text-xs font-extrabold text-stone-700 hover:border-stone-950 disabled:opacity-50"
                    >
                      {photo.cleaning ? "배경을 정리하는 중…" : "배경 제거·상품 정리"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-7 border-t border-stone-300 pt-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-stone-900">생성 품질</p>
                <p className="mt-1 text-xs text-stone-500">디자인 완성도 우선은 고품질 추천</p>
              </div>
              <select
                value={w.modelType}
                onChange={(event) => w.setModelType(event.target.value as ModelType)}
                className="h-10 border border-stone-300 bg-white px-3 text-xs font-bold outline-none focus:border-stone-950"
              >
                <option value={ModelType.PAID}>고품질</option>
                <option value={ModelType.FREE}>빠른 생성</option>
              </select>
            </div>
            <button
              type="button"
              disabled={!w.canResearch || Boolean(w.busy)}
              onClick={() => void w.runResearch()}
              className="flex h-14 w-full items-center justify-center gap-2 bg-stone-950 px-5 text-sm font-black text-white transition hover:bg-[#8A2E26] disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {w.busy === "research" ? "웹에서 상품을 조사하는 중…" : "AI 리서치 시작"}
              {!w.busy && <span aria-hidden="true">→</span>}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ResearchPhase({ workspace: w }: { workspace: ReturnType<typeof useDetailWorkspace> }) {
  const research = w.research;
  if (!research) return null;
  const pending = research.sellingPoints.filter((point) => point.decision === "pending").length;
  const approved = research.sellingPoints.filter((point) => point.decision === "approved").length;
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <p className="mb-2 text-sm font-extrabold text-[#8A2E26]">02 · 소구점 승인</p>
          <h2 className="text-3xl font-black tracking-[-0.045em] text-stone-950">
            쓸 말과 뺄 말을 직접 결정해.
          </h2>
          <p className="mt-3 text-sm leading-6 text-stone-500">{research.summary}</p>
        </div>
        <button
          type="button"
          onClick={() => w.setPhase("input")}
          className="self-start border-b border-stone-400 pb-1 text-sm font-bold text-stone-600"
        >
          상품 정보로 돌아가기
        </button>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
        <main>
          <div className="mb-4 flex items-center justify-between border-b border-stone-950 pb-4">
            <div>
              <h3 className="text-lg font-black text-stone-950">AI가 찾은 소구점</h3>
              <p className="mt-1 text-xs text-stone-500">모든 항목을 승인하거나 제외해야 다음으로 갈 수 있어.</p>
            </div>
            <span className="text-sm font-black text-stone-800">승인 {approved} · 대기 {pending}</span>
          </div>
          <div className="divide-y divide-stone-200 border-b border-stone-200">
            {research.sellingPoints.map((point, index) => {
              const evidence = evidenceLabels[point.evidenceLevel];
              return (
                <article
                  key={point.id}
                  className={cx(
                    "grid gap-4 py-6 sm:grid-cols-[42px_minmax(0,1fr)_190px]",
                    point.decision === "excluded" && "opacity-50",
                  )}
                >
                  <span className="pt-1 font-mono text-xs text-stone-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className={cx("px-2 py-1 text-[10px] font-extrabold", evidence.className)}>
                        {evidence.label}
                      </span>
                      {point.sourceIds.length > 0 && (
                        <span className="text-[11px] font-bold text-stone-400">
                          출처 {point.sourceIds.length}
                        </span>
                      )}
                    </div>
                    <input
                      value={point.title}
                      onChange={(event) =>
                        w.updateSellingPoint(point.id, { title: event.target.value })
                      }
                      className="w-full border-0 border-b border-transparent bg-transparent p-0 pb-1 text-lg font-black text-stone-950 outline-none focus:border-stone-300"
                    />
                    <textarea
                      value={point.description}
                      onChange={(event) =>
                        w.updateSellingPoint(point.id, { description: event.target.value })
                      }
                      rows={2}
                      className="mt-2 w-full resize-none border-0 bg-transparent p-0 text-sm leading-6 text-stone-600 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 self-center border border-stone-200">
                    <button
                      type="button"
                      onClick={() => w.updateSellingPoint(point.id, { decision: "approved" })}
                      className={cx(
                        "h-11 text-xs font-black",
                        point.decision === "approved"
                          ? "bg-emerald-700 text-white"
                          : "bg-white text-stone-600 hover:bg-emerald-50",
                      )}
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      onClick={() => w.updateSellingPoint(point.id, { decision: "excluded" })}
                      className={cx(
                        "h-11 border-l border-stone-200 text-xs font-black",
                        point.decision === "excluded"
                          ? "bg-stone-800 text-white"
                          : "bg-white text-stone-600 hover:bg-stone-100",
                      )}
                    >
                      제외
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </main>

        <aside className="space-y-6 lg:sticky lg:top-6">
          <section className="border border-stone-200 bg-[#F6F3ED] p-5">
            <p className="mb-4 text-xs font-black tracking-[0.14em] text-stone-500">GIFT DIRECTION</p>
            <FieldLabel>추천 선물 대상</FieldLabel>
            <input
              value={research.recommendedRecipient}
              onChange={(event) =>
                w.updateResearch({ recommendedRecipient: event.target.value })
              }
              className="h-12 w-full border border-stone-300 bg-white px-3 text-sm font-bold outline-none focus:border-stone-950"
            />
            <p className="mt-3 text-xs leading-5 text-stone-500">
              명절 표현: <strong className="text-stone-800">{research.seasonalCue}</strong>
            </p>
            {research.photoRoles.length > 0 && (
              <div className="mt-5 border-t border-stone-300 pt-4">
                <p className="text-xs font-black text-stone-800">사진 역할 분석</p>
                <ul className="mt-2 space-y-1 text-[11px] leading-5 text-stone-500">
                  {research.photoRoles.map((role, index) => (
                    <li key={index}>사진 {index + 1} · {role}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="border border-stone-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-black text-stone-900">조사 출처</h3>
              <span className="text-xs font-bold text-stone-400">{research.sources.length}개</span>
            </div>
            {research.sources.length ? (
              <ol className="space-y-3">
                {research.sources.slice(0, 12).map((source, index) => (
                  <li key={source.id} className="grid grid-cols-[20px_1fr] gap-2">
                    <span className="font-mono text-[10px] text-stone-400">{index + 1}</span>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="line-clamp-2 text-xs font-bold leading-5 text-stone-600 underline decoration-stone-300 underline-offset-2 hover:text-[#8A2E26]"
                    >
                      {source.title}
                    </a>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs leading-5 text-stone-400">검색 출처가 응답에 포함되지 않았어. 판매자 확인 필요 항목을 특히 살펴봐.</p>
            )}
            <p className="mt-4 border-t border-stone-100 pt-4 text-[11px] leading-5 text-stone-400">
              출처는 검토 화면에만 표시되고 결과 이미지에는 들어가지 않아.
            </p>
          </section>

          <button
            type="button"
            disabled={!w.pointsDecided || Boolean(w.busy)}
            onClick={() => void w.runPlan()}
            className="h-14 w-full bg-stone-950 px-4 text-sm font-black text-white hover:bg-[#8A2E26] disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {w.busy === "plan"
              ? "7컷 판매 흐름을 짜는 중…"
              : pending
                ? `대기 ${pending}개 결정하기`
                : approved
                  ? "승인한 내용으로 기획하기 →"
                  : "소구점을 1개 이상 승인해줘"}
          </button>
        </aside>
      </div>
    </div>
  );
}

function PlanPhase({ workspace: w }: { workspace: ReturnType<typeof useDetailWorkspace> }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-sm font-extrabold text-[#8A2E26]">03 · 기획 확인</p>
          <h2 className="text-3xl font-black tracking-[-0.045em] text-stone-950">
            만들기 전에 흐름부터 다듬어.
          </h2>
          <p className="mt-3 text-sm text-stone-500">제목·보조문구·사진 방향을 수정하고 순서를 바꿀 수 있어.</p>
        </div>
        <button
          type="button"
          onClick={() => w.setPhase("research")}
          className="self-start border-b border-stone-400 pb-1 text-sm font-bold text-stone-600"
        >
          소구점 다시 보기
        </button>
      </div>

      <section className="mb-10 border-y border-stone-200 py-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.15em] text-stone-400">DESIGN DIRECTION</p>
            <h3 className="mt-1 text-lg font-black text-stone-950">AI 추천 스타일을 바꿀 수 있어</h3>
          </div>
          <span className="hidden text-xs text-stone-400 sm:block">폰트·크기·그리드는 고정, 색과 사진 분위기만 변경</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {DESIGN_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => w.setStyleId(style.id)}
              className={cx(
                "grid min-h-32 grid-cols-[70px_1fr] items-center gap-4 border p-4 text-left transition",
                w.styleId === style.id
                  ? "border-stone-950 bg-white"
                  : "border-stone-200 bg-stone-50 hover:border-stone-400",
              )}
            >
              <span
                className="flex aspect-square items-end p-2"
                style={{ background: style.background, color: style.text }}
              >
                <i className="block h-1 w-full" style={{ background: style.accent }} />
              </span>
              <span>
                <strong className="block text-sm font-black text-stone-950">
                  {style.name}
                  {w.styleId === style.id && (
                    <em className="ml-2 not-italic text-[10px] text-[#8A2E26]">선택</em>
                  )}
                </strong>
                <small className="mt-1 block text-xs leading-5 text-stone-500">{style.description}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <main>
          <div className="mb-2 flex items-center justify-between border-b border-stone-950 pb-4">
            <h3 className="text-lg font-black text-stone-950">상세페이지 {w.segments.length}개 섹션</h3>
            <button
              type="button"
              onClick={w.addSegment}
              className="text-xs font-black text-stone-600 underline underline-offset-4"
            >
              + 섹션 추가
            </button>
          </div>
          <div className="divide-y divide-stone-200 border-b border-stone-200">
            {w.segments.map((segment, index) => (
              <article key={segment.id} className="grid gap-5 py-7 sm:grid-cols-[48px_minmax(0,1fr)]">
                <div>
                  <span className="font-mono text-xs text-stone-400">{String(index + 1).padStart(2, "0")}</span>
                  <span className="mt-2 block text-[9px] font-black tracking-wide text-[#8A2E26]">{segment.template}</span>
                </div>
                <div>
                  <input
                    value={segment.title}
                    onChange={(event) => w.updateSegment(index, { title: event.target.value })}
                    className="w-full border-0 border-b border-stone-200 bg-transparent p-0 pb-2 text-xl font-black tracking-[-0.02em] text-stone-950 outline-none focus:border-stone-950"
                  />
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <FieldLabel>보조 문구</FieldLabel>
                      <textarea
                        value={segment.logicalSections.join("\n")}
                        onChange={(event) =>
                          w.updateSegment(index, {
                            logicalSections: event.target.value.split(/\r?\n/).filter(Boolean),
                          })
                        }
                        rows={3}
                        className="w-full resize-none border border-stone-200 px-3 py-2 text-sm leading-6 outline-none focus:border-stone-950"
                      />
                    </div>
                    <div>
                      <FieldLabel>사진 연출 방향</FieldLabel>
                      <textarea
                        value={segment.visualPrompt}
                        onChange={(event) =>
                          w.updateSegment(index, { visualPrompt: event.target.value })
                        }
                        rows={3}
                        className="w-full resize-none border border-stone-200 px-3 py-2 text-sm leading-6 text-stone-600 outline-none focus:border-stone-950"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs font-bold text-stone-500">
                    <button type="button" disabled={index === 0} onClick={() => w.moveSegment(index, -1)} className="disabled:opacity-25">
                      ↑ 위로
                    </button>
                    <button type="button" disabled={index === w.segments.length - 1} onClick={() => w.moveSegment(index, 1)} className="disabled:opacity-25">
                      ↓ 아래로
                    </button>
                    <button type="button" disabled={w.segments.length <= 1} onClick={() => w.deleteSegment(index)} className="ml-auto text-red-700 disabled:opacity-25">
                      삭제
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>
        <aside className="border border-stone-200 bg-[#F6F3ED] p-5 lg:sticky lg:top-6">
          <p className="text-xs font-black tracking-[0.14em] text-stone-500">BEFORE GENERATION</p>
          <ul className="mt-4 space-y-3 text-xs leading-5 text-stone-600">
            <li>✓ 승인한 소구점만 카피에 사용</li>
            <li>✓ 사진에는 글자를 생성하지 않음</li>
            <li>✓ 전 섹션 동일 폰트·크기 체계 사용</li>
            <li>✓ 가격·할인·그릿마켓 브랜드 제외</li>
          </ul>
          <button
            type="button"
            disabled={!w.segments.length || Boolean(w.busy)}
            onClick={() => void w.generateSample()}
            className="mt-6 h-14 w-full bg-stone-950 px-3 text-sm font-black text-white hover:bg-[#8A2E26] disabled:bg-stone-300"
          >
            대표 시안 1장 먼저 만들기 →
          </button>
          <p className="mt-3 text-[11px] leading-5 text-stone-400">대표 시안을 승인해야 나머지 {Math.max(0, w.segments.length - 1)}장을 만들 수 있어.</p>
          <div className="mt-4 border-t border-stone-200 pt-3">
            <UsageLine workspace={w} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function PageSection({
  segment,
  style,
  selected,
  onSelect,
  sectionRef,
}: {
  segment: DetailImageSegment;
  style: (typeof DESIGN_STYLES)[number];
  selected: boolean;
  onSelect: () => void;
  sectionRef: (node: HTMLDivElement | null) => void;
}) {
  const layout = segment.layout ?? "top";
  const tone = segment.tone ?? "light";
  const position: Record<SegmentLayout, string> = {
    top: "justify-start pt-[12%]",
    center: "justify-center",
    bottom: "justify-end pb-[13%]",
  };
  const isLight = tone === "light";
  const textColor = isLight ? style.text : "#FFFFFF";
  const gradient =
    layout === "top"
      ? isLight
        ? "linear-gradient(180deg, rgba(255,253,248,.96) 0%, rgba(255,253,248,.78) 24%, transparent 58%)"
        : "linear-gradient(180deg, rgba(12,12,10,.82) 0%, rgba(12,12,10,.5) 28%, transparent 62%)"
      : layout === "bottom"
        ? isLight
          ? "linear-gradient(0deg, rgba(255,253,248,.96) 0%, rgba(255,253,248,.76) 27%, transparent 60%)"
          : "linear-gradient(0deg, rgba(12,12,10,.84) 0%, rgba(12,12,10,.48) 29%, transparent 64%)"
        : isLight
          ? "linear-gradient(180deg, transparent 12%, rgba(255,253,248,.9) 34%, rgba(255,253,248,.9) 66%, transparent 88%)"
          : "linear-gradient(180deg, transparent 8%, rgba(12,12,10,.76) 34%, rgba(12,12,10,.76) 66%, transparent 92%)";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cx("block w-full text-left outline-none", selected && "ring-2 ring-[#8A2E26] ring-offset-4")}
      aria-label={`${segment.title} 편집`}
    >
      <div
        ref={sectionRef}
        className="relative aspect-[9/16] w-full overflow-hidden"
        style={{
          backgroundColor: tone === "accent" ? style.accent : style.background,
          fontFamily: DETAIL_PAGE_FONT,
        }}
      >
        {segment.imageUrl ? (
          <img
            src={segment.imageUrl}
            alt=""
            crossOrigin="anonymous"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 70% 30%, ${style.surface}, transparent 48%), ${style.background}`,
            }}
          />
        )}
        <div className="absolute inset-0" style={{ background: gradient }} />
        <div
          className={cx("absolute inset-0 flex px-[9%] text-center", position[layout])}
          style={{ color: textColor }}
        >
          <div className="w-full">
            <p
              className="mb-[4%] text-[clamp(9px,1.4vw,15px)] font-extrabold tracking-[0.18em]"
              style={{ color: isLight ? style.accent : "rgba(255,255,255,.76)" }}
            >
              {segment.template === "HERO" ? "PRODUCT EDIT" : segment.keyMessage}
            </p>
            <h3 className="whitespace-pre-line text-[clamp(25px,5.2vw,56px)] font-black leading-[1.16] tracking-[-0.055em]">
              {segment.title}
            </h3>
            {segment.logicalSections.length > 0 && (
              <div className="mx-auto mt-[6%] max-w-[82%] space-y-[2.5%]">
                {segment.logicalSections.slice(0, 3).map((line, index) => (
                  <p
                    key={index}
                    className="text-[clamp(11px,1.8vw,19px)] font-semibold leading-[1.55] tracking-[-0.025em]"
                    style={{ opacity: 0.86 }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            )}
            <i
              className="mx-auto mt-[7%] block h-[3px] w-[34px]"
              style={{ background: isLight ? style.accent : "rgba(255,255,255,.7)" }}
            />
          </div>
        </div>
        {segment.isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-950/60 text-white backdrop-blur-sm">
            <div className="text-center">
              <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <p className="mt-4 text-xs font-black tracking-wide">사진을 만드는 중</p>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

function ResultPhase({ workspace: w }: { workspace: ReturnType<typeof useDetailWorkspace> }) {
  const style = DESIGN_STYLES.find((item) => item.id === w.styleId) ?? DESIGN_STYLES[0];
  const selected = w.segments[w.selectedSegment];
  const [editorOpen, setEditorOpen] = useState(true);
  const [exportingLong, setExportingLong] = useState(false);
  const [format, setFormat] = useState<"jpg" | "webp">("jpg");
  const generationDone = w.generationDone;
  const readyToExport = w.sampleApproved && generationDone === w.segments.length;
  const visibleSegments = w.sampleApproved ? w.segments : w.segments.slice(0, 1);

  const safeName = useMemo(
    () => (w.info.name || "detail_page").replace(/[\\/:*?"<>|]/g, "_"),
    [w.info.name],
  );

  const saveLongPage = async () => {
    if (!w.longPageRef.current || exportingLong) return;
    setExportingLong(true);
    try {
      const blob = await captureNodeToBlob(w.longPageRef.current, format, {
        scale: 1,
        webpQuality: 0.92,
        jpgQuality: 0.96,
      });
      saveAs(blob, `${safeName}_long.${format}`);
    } finally {
      setExportingLong(false);
    }
  };

  const exportSplit = () =>
    w.exportState.exportZip(format, {
      nodes: w.pageRefs.current,
      shouldInclude: (index) => Boolean(w.segments[index]),
      baseName: safeName,
      scale: 2,
      webpQuality: 0.92,
      jpgQuality: 0.96,
    });

  return (
    <div className="bg-stone-100">
      <div className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <p className="text-sm font-black text-stone-950">{w.info.name}</p>
            <p className="text-[11px] text-stone-400">완성 {generationDone}/{w.segments.length} · {style.name}</p>
            <UsageLine workspace={w} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={Boolean(w.busy)} onClick={() => w.setPhase("plan")} className="h-10 px-3 text-xs font-bold text-stone-600 hover:bg-stone-100 disabled:opacity-40">
              기획으로
            </button>
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value as "jpg" | "webp")}
              className="h-10 border border-stone-300 bg-white px-3 text-xs font-bold outline-none"
            >
              <option value="jpg">JPG</option>
              <option value="webp">WebP</option>
            </select>
            <button
              type="button"
              disabled={exportingLong || !readyToExport}
              onClick={() => void saveLongPage()}
              className="h-10 border border-stone-950 bg-white px-4 text-xs font-black text-stone-950 disabled:opacity-50"
            >
              {exportingLong ? "저장 중…" : "긴 이미지 저장"}
            </button>
            <button
              type="button"
              disabled={w.exportState.downloading || !readyToExport}
              onClick={() => void exportSplit()}
              className="h-10 bg-stone-950 px-4 text-xs font-black text-white hover:bg-[#8A2E26] disabled:opacity-50"
            >
              자동 분할 ZIP
            </button>
          </div>
        </div>
      </div>

      <div
        className={cx(
          "mx-auto grid max-w-7xl items-start gap-7 px-4 py-8 sm:px-6",
          editorOpen ? "lg:grid-cols-[minmax(0,760px)_340px]" : "lg:grid-cols-[minmax(0,760px)_56px]",
        )}
      >
        <main className="mx-auto w-full max-w-[760px]">
          {!w.sampleApproved && (
            <section className="mb-5 border border-stone-200 bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-5">
              <div>
                <p className="text-xs font-black tracking-[0.12em] text-[#8A2E26]">대표 시안 확인</p>
                <p className="mt-2 text-sm font-black text-stone-950">
                  {w.sampleReady ? "사진 분위기와 글자 배치를 확인해줘." : "대표 시안 1장을 만드는 중이야."}
                </p>
                <p className="mt-1 text-xs leading-5 text-stone-500">폰트와 크기 체계는 끝까지 동일하게 유지돼.</p>
              </div>
              <div className="mt-4 grid shrink-0 gap-2 sm:mt-0">
                <button
                  type="button"
                  disabled={!w.sampleReady || Boolean(w.busy)}
                  onClick={() => void w.generateRemaining()}
                  className="h-11 bg-stone-950 px-5 text-xs font-black text-white hover:bg-[#8A2E26] disabled:bg-stone-300"
                >
                  이 디자인 승인 · 나머지 {Math.max(0, w.segments.length - 1)}장 만들기
                </button>
                <button
                  type="button"
                  disabled={!w.sampleReady || Boolean(w.busy)}
                  onClick={() => void w.regenerateSegment(0)}
                  className="h-9 border border-stone-300 px-4 text-xs font-bold text-stone-600 disabled:opacity-40"
                >
                  대표 시안 다시 만들기
                </button>
              </div>
            </section>
          )}
          <div ref={w.longPageRef} className="w-full bg-white">
            {visibleSegments.map((segment, index) => (
              <PageSection
                key={segment.id}
                segment={segment}
                style={style}
                selected={index === w.selectedSegment && editorOpen}
                onSelect={() => {
                  w.setSelectedSegment(index);
                  setEditorOpen(true);
                }}
                sectionRef={(node) => {
                  w.pageRefs.current[index] = node;
                }}
              />
            ))}
          </div>
        </main>

        <aside className="lg:sticky lg:top-24">
          {!editorOpen ? (
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="flex h-12 w-full items-center justify-center border border-stone-300 bg-white text-xs font-black text-stone-700 lg:h-56 lg:[writing-mode:vertical-rl]"
            >
              편집 열기
            </button>
          ) : selected ? (
            <div className="border border-stone-200 bg-white">
              <div className="flex items-start justify-between border-b border-stone-200 p-5">
                <div>
                  <p className="text-[10px] font-black tracking-[0.15em] text-[#8A2E26]">
                    SECTION {String(w.selectedSegment + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-sm font-black text-stone-950">{selected.template}</p>
                </div>
                <button type="button" onClick={() => setEditorOpen(false)} className="text-xs font-bold text-stone-400">
                  닫기
                </button>
              </div>
              <div className="space-y-5 p-5">
                <div>
                  <FieldLabel>제목</FieldLabel>
                  <textarea
                    rows={2}
                    value={selected.title}
                    onChange={(event) =>
                      w.updateSegment(w.selectedSegment, { title: event.target.value })
                    }
                    className="w-full resize-none border border-stone-200 px-3 py-2 text-sm font-black leading-6 outline-none focus:border-stone-950"
                  />
                </div>
                <div>
                  <FieldLabel>보조 문구</FieldLabel>
                  <textarea
                    rows={4}
                    value={selected.logicalSections.join("\n")}
                    onChange={(event) =>
                      w.updateSegment(w.selectedSegment, {
                        logicalSections: event.target.value.split(/\r?\n/).filter(Boolean),
                      })
                    }
                    className="w-full resize-none border border-stone-200 px-3 py-2 text-sm leading-6 outline-none focus:border-stone-950"
                  />
                </div>
                <div>
                  <FieldLabel>글자 위치</FieldLabel>
                  <div className="grid grid-cols-3 border border-stone-200">
                    {(["top", "center", "bottom"] as SegmentLayout[]).map((layout, index) => (
                      <button
                        key={layout}
                        type="button"
                        onClick={() => w.updateSegment(w.selectedSegment, { layout })}
                        className={cx(
                          "h-10 text-xs font-bold",
                          index > 0 && "border-l border-stone-200",
                          selected.layout === layout ? "bg-stone-950 text-white" : "text-stone-500",
                        )}
                      >
                        {layout === "top" ? "위" : layout === "center" ? "가운데" : "아래"}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => w.cycleSegmentTone(w.selectedSegment)}
                  className="flex h-11 w-full items-center justify-between border border-stone-200 px-3 text-xs font-bold text-stone-700"
                >
                  <span>이 섹션 색감</span>
                  <span className="text-[#8A2E26]">
                    {selected.tone === "deep" ? "딥" : selected.tone === "accent" ? "포인트" : "라이트"} ↻
                  </span>
                </button>
                <div>
                  <FieldLabel>사진 연출 요청</FieldLabel>
                  <textarea
                    rows={4}
                    value={selected.visualPrompt}
                    onChange={(event) =>
                      w.updateSegment(w.selectedSegment, { visualPrompt: event.target.value })
                    }
                    className="w-full resize-none border border-stone-200 px-3 py-2 text-xs leading-5 text-stone-600 outline-none focus:border-stone-950"
                  />
                  <button
                    type="button"
                    disabled={selected.isGenerating}
                    onClick={() => void w.regenerateSegment(w.selectedSegment)}
                    className="mt-3 h-12 w-full bg-[#8A2E26] text-xs font-black text-white disabled:bg-stone-300"
                  >
                    {selected.isGenerating ? "사진 다시 만드는 중…" : "이 섹션 사진만 다시 만들기"}
                  </button>
                </div>
                <div className="grid grid-cols-2 border-y border-stone-200 py-3">
                  <button
                    type="button"
                    disabled={!selected.history?.length}
                    onClick={() => w.undoSegment(w.selectedSegment)}
                    className="h-9 text-xs font-bold text-stone-600 disabled:opacity-25"
                  >
                    ← 이전 사진
                  </button>
                  <button
                    type="button"
                    disabled={!selected.future?.length}
                    onClick={() => w.redoSegment(w.selectedSegment)}
                    className="h-9 border-l border-stone-200 text-xs font-bold text-stone-600 disabled:opacity-25"
                  >
                    다음 사진 →
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" disabled={!w.sampleApproved || w.selectedSegment === 0} onClick={() => w.moveSegment(w.selectedSegment, -1)} className="h-9 border border-stone-200 text-xs font-bold disabled:opacity-25">
                    위로
                  </button>
                  <button type="button" disabled={!w.sampleApproved || w.selectedSegment === w.segments.length - 1} onClick={() => w.moveSegment(w.selectedSegment, 1)} className="h-9 border border-stone-200 text-xs font-bold disabled:opacity-25">
                    아래로
                  </button>
                  <button type="button" disabled={!w.sampleApproved || w.segments.length <= 1} onClick={() => w.deleteSegment(w.selectedSegment)} className="h-9 border border-red-200 text-xs font-bold text-red-700 disabled:opacity-25">
                    삭제
                  </button>
                </div>
                <button type="button" disabled={!w.sampleApproved} onClick={w.addSegment} className="h-10 w-full border border-dashed border-stone-300 text-xs font-bold text-stone-500 disabled:opacity-30">
                  + 새 섹션 추가
                </button>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
      <ExportProgressOverlay open={w.exportState.downloading} progress={w.exportState.progress} />
    </div>
  );
}

function BusyOverlay({ job }: { job: Exclude<ReturnType<typeof useDetailWorkspace>["busy"], null> }) {
  const copy = {
    research: ["상품을 여러 경로로 조사하고 있어", "공식 자료와 고객 언어를 나눠서 확인 중"],
    plan: ["승인한 내용으로 판매 흐름을 짜고 있어", "카피와 사진 방향을 7개 섹션에 배치 중"],
    generate: ["상세페이지 사진을 만들고 있어", "완성되는 섹션부터 바로 보여줄게"],
  }[job];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm border border-white/20 bg-white p-8 text-center">
        <span className="mx-auto block h-11 w-11 animate-spin rounded-full border-2 border-stone-900 border-t-transparent" />
        <p className="mt-6 text-base font-black text-stone-950">{copy[0]}</p>
        <p className="mt-2 text-xs leading-5 text-stone-500">{copy[1]}</p>
      </div>
    </div>
  );
}

const DetailPlanner: React.FC = () => {
  const workspace = useDetailWorkspace();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const prefill = String(
      (location.state as { prefillName?: string } | null)?.prefillName ??
        searchParams.get("name") ??
        "",
    ).trim();
    if (prefill && !workspace.info.name.trim()) {
      workspace.setInfo((current) => ({ ...current, name: prefill }));
    }
    // 첫 진입 시에만 소싱 상품명을 가져온다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="-mx-6 -my-8 min-h-screen bg-[#FBFAF7] text-stone-900"
      style={{ fontFamily: DETAIL_PAGE_FONT }}
    >
      <ProgressHeader phase={workspace.phase} onMove={workspace.setPhase} />
      {workspace.phase === "input" && <InputPhase workspace={workspace} />}
      {workspace.phase === "research" && <ResearchPhase workspace={workspace} />}
      {workspace.phase === "plan" && <PlanPhase workspace={workspace} />}
      {workspace.phase === "result" && <ResultPhase workspace={workspace} />}
      {workspace.busy && workspace.busy !== "generate" && <BusyOverlay job={workspace.busy} />}
    </div>
  );
};

export default DetailPlanner;
