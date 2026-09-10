import React, { useMemo, useState } from "react";

import Button from "@/shared/ui/button/Button";
import { toastStore } from "@/shared/model/toastStore";
import { globalLoading } from "@/shared/model/globalLoading";
import { Type } from "@sinclair/typebox";
import { generateJsonWithSchema } from "@/shared/api/openai/openaiService";
import { withTimeout } from "@/shared/lib/async";

const MODELS = {
  PRIMARY: "gpt-6-astra",
  FALLBACK: "gpt-4.1",
} as const;

function normalizeTokens(input: string) {
  if (!input) return [];

  const lines = input
    .split(/\r?\n/) // ✅ 줄바꿈 기준
    .map((line) => line.trim()) // 앞뒤 공백만 제거
    .filter(Boolean); // 빈 줄 제거

  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(line);
  }

  return result;
}

function joinComma(tokens: string[]) {
  return tokens.join(", ");
}

async function recommendTags(baseTokens: string[]) {
  const schema = Type.Object(
    {
      recommended: Type.Array(Type.String()),
    },
    { additionalProperties: false },
  );
  const prompt = [
    "너는 쿠팡 판매자용 '검색 태그' 추천 도우미다.",
    "",
    "입력된 태그 후보(이미 포함됨):",
    baseTokens.map((t) => `- ${t}`).join("\n"),
    "",
    "요구사항:",
    "- 이미 포함된 단어/표현은 추천하지 말 것",
    "- 쿠팡에서 검색에 잘 걸릴 만한 태그를 15~30개 추천",
    "- 각 항목은 콤마를 포함하지 않는 '짧은 단어/짧은 구(2~4단어 이내)'",
    "- 브랜드/상표처럼 민감한 고유명사 남발 금지(일반 키워드 위주)",
    "- 중복/유사중복 제거",
    "",
    "반드시 JSON으로만 응답한다.",
    '형식: {"recommended": ["...", "..."]}',
  ].join("\n");

  const run = (model: string) =>
    withTimeout(
      () =>
        generateJsonWithSchema<{ recommended: string[] }>(
          model,
          prompt,
          schema,
        ),
      30_000,
    );

  try {
    return await run(MODELS.PRIMARY);
  } catch {
    // primary 실패 시 fallback 1회
    return await run(MODELS.FALLBACK);
  }
}

const TagGenerator: React.FC = () => {
  const [raw, setRaw] = useState("");
  const [formatted, setFormatted] = useState("");
  const [recommended, setRecommended] = useState<string[]>([]);

  const baseTokens = useMemo(() => normalizeTokens(raw), [raw]);
  const formattedPreview = useMemo(() => joinComma(baseTokens), [baseTokens]);

  const doFormat = () => {
    if (!baseTokens.length) {
      toastStore.push({
        type: "error",
        title: "입력 필요",
        message: "공백/줄바꿈으로 구분된 태그 후보를 입력해 주세요.",
      });
      return;
    }
    setFormatted(formattedPreview);
    toastStore.push({
      type: "success",
      title: "완료",
      message: `쉼표로 ${baseTokens.length}개 태그를 정리했습니다.`,
    });
  };

  const doCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toastStore.push({
        type: "success",
        title: "복사됨",
        message: "클립보드에 복사했습니다.",
      });
    } catch {
      toastStore.push({
        type: "error",
        title: "복사 실패",
        message: "브라우저 권한을 확인해 주세요.",
      });
    }
  };

  const doRecommend = async () => {
    if (!baseTokens.length) {
      toastStore.push({
        type: "error",
        title: "입력 필요",
        message: "먼저 태그 후보를 입력해 주세요.",
      });
      return;
    }

    globalLoading.start();
    try {
      const res = await recommendTags(baseTokens);
      const clean = (res.recommended ?? [])
        .map((s) => (s ?? "").trim())
        .filter(Boolean);

      const baseSet = new Set(baseTokens.map((t) => t.toLowerCase()));
      const seen = new Set<string>();
      const out: string[] = [];
      for (const t of clean) {
        const key = t.toLowerCase();
        if (baseSet.has(key)) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(t);
      }

      setRecommended(out);
      toastStore.push({
        type: "success",
        title: "추천 완료",
        message: `추천 태그 ${out.length}개를 생성했습니다.`,
      });
    } catch (e: any) {
      console.error(e);
      toastStore.push({
        type: "error",
        title: "추천 실패",
        message: e?.message
          ? String(e.message)
          : "AI 추천 중 오류가 발생했습니다.",
        durationMs: 6000,
      });
    } finally {
      globalLoading.end();
    }
  };

  const mergeAll = () => {
    const merged = [...baseTokens, ...recommended];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of merged) {
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
    }
    const text = joinComma(out);
    setFormatted(text);
    toastStore.push({
      type: "success",
      title: "병합 완료",
      message: `총 ${out.length}개 태그로 합쳤습니다.`,
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <div className="text-2xl font-black text-slate-900">태그 생성기</div>
        <div className="text-sm text-slate-600">
          공백/줄바꿈으로 나열된 태그를 쉼표(,) 형태로 정리하고, AI로 추가
          추천을 받습니다.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="font-bold text-slate-900">입력</div>
            <div className="text-xs text-slate-500">
              감지된 태그: {baseTokens.length}개
            </div>
          </div>

          <textarea
            className={[
              "w-full min-h-[240px] rounded-2xl border border-slate-200 bg-white px-4 py-3",
              "text-sm text-slate-900 placeholder:text-slate-400 shadow-sm",
              "focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500",
            ].join(" ")}
            placeholder={
              "예) 여름원피스 린넨원피스 데일리룩 하객룩\n(공백/줄바꿈 구분, 콤마 없어도 됨)"
            }
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={doFormat}>
              쉼표 붙이기
            </Button>
            <Button variant="secondary" onClick={doRecommend}>
              AI 추천 받기
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setRaw("");
                setFormatted("");
                setRecommended([]);
              }}
            >
              초기화
            </Button>
          </div>

          <div className="text-xs text-slate-500">
            팁: 이미 콤마가 섞여 있어도 자동으로 정리됩니다.
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="font-bold text-slate-900">결과</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={!formatted}
                onClick={() => doCopy(formatted)}
              >
                결과 복사
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={!formattedPreview}
                onClick={() => doCopy(formattedPreview)}
              >
                미리보기 복사
              </Button>
            </div>
          </div>

          <textarea
            className={[
              "w-full min-h-[240px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3",
              "text-sm text-slate-900 placeholder:text-slate-400 shadow-sm",
              "focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500",
            ].join(" ")}
            placeholder="쉼표가 붙은 결과가 여기에 표시됩니다."
            value={formatted || formattedPreview}
            onChange={(e) => setFormatted(e.target.value)}
          />

          {recommended.length ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900">
                  AI 추천 ({recommended.length}개)
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={mergeAll}>
                    추천 포함해서 결과 만들기
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => doCopy(joinComma(recommended))}
                  >
                    추천만 복사
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {recommended.slice(0, 60).map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {recommended.length > 60 ? (
                <div className="text-xs text-slate-500">
                  화면에는 60개까지만 표시됩니다. “추천만 복사”로 전체를
                  복사하세요.
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              “AI 추천 받기”를 누르면 추가 태그가 여기 표시됩니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagGenerator;
