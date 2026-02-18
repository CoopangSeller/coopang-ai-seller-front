import React from "react";
import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import StepInput from "./steps/StepInput";
import ResultPreview from "./result/ResultPreview";
import { useDetailPlannerState } from "../model/useDetailPlannerState";

const DetailPlanner: React.FC = () => {
  const s = useDetailPlannerState();
  const [elapsed, setElapsed] = useState(0);
  const loc = useLocation();
  const [sp] = useSearchParams();

  // ✅ 소싱에서 "기획하기" 진입 시 판매상품명 자동 세팅
  useEffect(() => {
    const fromState = (loc.state as any)?.prefillName;
    const fromQuery = sp.get("name");
    const name = String(fromState ?? fromQuery ?? "").trim();
    if (!name) return;
    if ((s.info.name ?? "").trim()) return;
    s.setInfo((prev) => ({ ...prev, name }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!s.isPlanning) return;

    setElapsed(0);
    const id = setInterval(() => {
      setElapsed((v) => v + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [s.isPlanning]);

  return (
    <div className="w-full">
      {s.step === 1 && (
        <StepInput
          // step1 product
          info={s.info}
          setInfo={s.setInfo}
          competitorUrl={s.competitorUrl}
          setCompetitorUrl={s.setCompetitorUrl}
          competitorPaste={s.competitorPaste}
          setCompetitorPaste={s.setCompetitorPaste}
          uspLoading={s.uspLoading}
          resetAll={s.resetAll}
          canPlan={s.canPlan}
          // step2 cut studio
          modelType={s.modelType}
          onChangeModelType={s.setModelType}
          cutTab={s.cutTab}
          onChangeCutTab={s.setCutTab}
          cutPreviews={s.cutPreviews}
          generatingCut={s.generatingCut}
          onGenerateCut={s.onGenerateCut}
          onPickFinalCut={s.onPickFinalCut}
          // step3 final compose
          finalCuts={s.finalCuts}
          onUploadFinalCut={s.onUploadFinalCut}
          onClearFinalCut={s.onClearFinalCut}
          extraImages={s.extraImages}
          onAddExtraImages={s.onAddExtraImages}
          onRemoveExtraImage={s.onRemoveExtraImage}
          finalExtraPrompt={s.finalExtraPrompt}
          onChangeFinalExtraPrompt={s.onChangeFinalExtraPrompt}
          // next
          onNext={s.handlePlanAndGenerateAll}
        />
      )}

      {s.step === 3 && (
        <ResultPreview
          name={s.info.name}
          segments={s.segments}
          pageRefs={s.pageRefs}
          downloading={s.downloading}
          progress={s.progress}
          exportZip={s.exportZip}
          onBack={() => s.setStep(1)}
          updateSegment={s.updateSegment}
          onRegenerateOne={s.regenerateOne}
          onUndoOne={s.undoOne}
          onRedoOne={s.redoOne}
        />
      )}

      {s.isPlanning && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center space-y-4 max-w-sm text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />

            {elapsed < 30 && (
              <p className="font-bold">AI가 기획안을 생성 중입니다</p>
            )}

            {elapsed >= 30 && elapsed < 50 && (
              <>
                <p className="font-bold text-slate-800">
                  AI 서버가 혼잡해 지연되고 있습니다
                </p>
                <p className="text-slate-500 text-sm">입력 문제는 아닙니다</p>
              </>
            )}

            {elapsed >= 50 && (
              <>
                <p className="font-bold text-slate-800">
                  기획 생성이 오래 걸리고 있습니다
                </p>
                <p className="text-slate-500 text-sm">
                  계속 기다리거나 중단할 수 있습니다
                </p>

                <button
                  className="
                    mt-3 px-4 py-2 rounded-lg
                    bg-slate-200 text-slate-700 font-semibold
                    hover:bg-red-100 hover:text-red-600
                    active:bg-red-200
                    transition-colors duration-200
                  "
                  onClick={s.cancelPlanning}
                >
                  중단하고 돌아가기
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailPlanner;
