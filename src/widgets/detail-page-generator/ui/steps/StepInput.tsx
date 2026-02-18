// widgets/detail-page-generator/ui/steps/StepInput.tsx
import React from "react";
import { DetailShotKey, ProductInfo } from "../../model/types";
import { ModelType } from "@/shared/types";
import Step1ProductCard from "./Step1ProductCard";
import Step2CutStudioCard from "./Step2CutStudioCard";
import Step3FinalComposeCard from "./Step3FinalComposeCard";

type Props = {
  finalExtraPrompt: string;
  onChangeFinalExtraPrompt: (v: string) => void;

  extraImages: string[];

  onRemoveExtraImage: (index: number) => void;

  onAddExtraImages: (dataUrls: string[]) => void;

  info: ProductInfo;
  setInfo: React.Dispatch<React.SetStateAction<ProductInfo>>;

  modelType: ModelType;
  onChangeModelType: (m: ModelType) => void;

  cutTab: DetailShotKey;
  onChangeCutTab: (t: DetailShotKey) => void;

  cutPreviews: Record<DetailShotKey, string[]>;
  generatingCut: boolean;
  onGenerateCut: (key: DetailShotKey) => Promise<void>;
  onPickFinalCut: (key: DetailShotKey, img: string) => void;

  finalCuts: Record<DetailShotKey, string | null>;
  onUploadFinalCut: (key: DetailShotKey, dataUrl: string) => void;
  onClearFinalCut: (key: DetailShotKey) => void;

  competitorUrl: string;
  setCompetitorUrl: (v: string) => void;
  competitorPaste: string;
  setCompetitorPaste: (v: string) => void;
  uspLoading: boolean;

  canPlan: boolean;
  resetAll: () => void;

  onNext: () => void;
};

const StepInput: React.FC<Props> = (p) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Step1ProductCard
        info={p.info}
        setInfo={p.setInfo}
        competitorUrl={p.competitorUrl}
        setCompetitorUrl={p.setCompetitorUrl}
        competitorPaste={p.competitorPaste}
        setCompetitorPaste={p.setCompetitorPaste}
        uspLoading={p.uspLoading}
        resetAll={p.resetAll}
      />

      <Step2CutStudioCard
        info={p.info}
        setInfo={p.setInfo}
        modelType={p.modelType}
        setModelType={p.onChangeModelType}
        cutTab={p.cutTab}
        setCutTab={p.onChangeCutTab}
        cutPreviews={p.cutPreviews}
        generatingCut={p.generatingCut}
        onGenerateCut={p.onGenerateCut}
        onPickFinalCut={p.onPickFinalCut}
      />

      <Step3FinalComposeCard
        info={p.info}
        setInfo={p.setInfo}
        finalCuts={p.finalCuts}
        onUploadFinalCut={p.onUploadFinalCut}
        onClearFinalCut={p.onClearFinalCut}
        extraImages={p.extraImages}
        onAddExtraImages={p.onAddExtraImages}
        onRemoveExtraImage={p.onRemoveExtraImage}
        finalExtraPrompt={p.finalExtraPrompt}
        onChangeFinalExtraPrompt={p.onChangeFinalExtraPrompt}
        onNext={p.onNext}
        canPlan={p.canPlan}
      />

      {/* Plan button */}
      <button
        type="button"
        onClick={p.onNext}
        // disabled={!canPlan}
        className="w-full py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        상세페이지 생성하기
      </button>
    </div>
  );
};

export default StepInput;
