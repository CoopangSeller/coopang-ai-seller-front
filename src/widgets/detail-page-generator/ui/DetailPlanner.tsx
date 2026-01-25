import React from "react";
import StepInput from "./steps/StepInput";
import PlanReview from "./review/PlanReview";
import ResultPreview from "./result/ResultPreview";
import { useDetailPlannerState } from "../model/useDetailPlannerState";

const DetailPlanner: React.FC = () => {
  const s = useDetailPlannerState();

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
          onSuggestUSP={s.onSuggestUSP}
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
          onNext={s.handlePlan}
        />
      )}

      {s.step === 2 && (
        <PlanReview
          segments={s.segments}
          updateSegment={s.updateSegment}
          onBack={() => s.setStep(1)}
          onGenerateAll={s.handleGenerateAll}
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
          onBack={() => s.setStep(2)}
          updateSegment={s.updateSegment}
          onRegenerateOne={s.regenerateOne}
          onUndoOne={s.undoOne}
          onRedoOne={s.redoOne}
        />
      )}

      {s.loading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center space-y-4 max-w-sm text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <h3 className="text-xl font-black text-slate-800">
              AI가 작업 중입니다
            </h3>
            <p className="text-slate-500 font-semibold">잠시만 기다려주세요!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailPlanner;
