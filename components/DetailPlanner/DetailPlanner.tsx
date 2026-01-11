
import React, { useState } from 'react';
import { ProductInfo, PageLength, DetailImageSegment, ModelType } from '../../types';
import Step1Input from './Step1Input';
import { planDetailPage, generateImage } from '../../services/geminiService';

const DetailPlanner: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [modelType, setModelType] = useState<ModelType>(ModelType.FREE);
  const [info, setInfo] = useState<ProductInfo>({
    name: '',
    category: '',
    price: '',
    features: '',
    targetGender: ['전체'],
    targetAge: ['30대'],
    pageLength: PageLength.STANDARD,
  });

  const [segments, setSegments] = useState<DetailImageSegment[]>([]);

  const handlePlan = async () => {
    setLoading(true);
    try {
      const result = await planDetailPage(info);
      setSegments(result);
      setStep(2);
    } catch (e) {
      alert("기획안 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    setLoading(true);
    setStep(3);
    const updatedSegments = [...segments];
    
    for (let i = 0; i < updatedSegments.length; i++) {
      try {
        updatedSegments[i] = { ...updatedSegments[i], isGenerating: true };
        setSegments([...updatedSegments]);
        
        const imageUrl = await generateImage(
          updatedSegments[i].visualPrompt, 
          modelType, 
          "9:16", 
          info.referenceImage
        );
        
        if (imageUrl) {
          updatedSegments[i] = { ...updatedSegments[i], imageUrl, isGenerating: false };
        } else {
          updatedSegments[i] = { ...updatedSegments[i], isGenerating: false };
        }
        setSegments([...updatedSegments]);
      } catch (e) {
        console.error("Generation error for segment", i, e);
        updatedSegments[i] = { ...updatedSegments[i], isGenerating: false };
        setSegments([...updatedSegments]);
      }
    }
    setLoading(false);
  };

  const updateSegment = (index: number, field: keyof DetailImageSegment, value: string) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setSegments(newSegments);
  };

  return (
    <div className="w-full">
      {step === 1 && <Step1Input info={info} setInfo={setInfo} onNext={handlePlan} />}
      
      {step === 2 && (
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">2단계: 기획안 검토 및 수정</h2>
            <div className="flex items-center gap-4">
              <div className="flex flex-col text-right">
                <span className="text-xs text-slate-500 mb-1 font-semibold">모델 선택</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setModelType(ModelType.FREE)}
                    className={`px-3 py-1 rounded-md text-xs border transition-all ${modelType === ModelType.FREE ? 'bg-green-500 text-white border-green-500' : 'bg-white text-slate-600 border-slate-200'}`}
                  >
                    무료 (Flash)
                  </button>
                  <button 
                    onClick={() => setModelType(ModelType.PAID)}
                    className={`px-3 py-1 rounded-md text-xs border transition-all ${modelType === ModelType.PAID ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200'}`}
                  >
                    유료 (Nanobanana Pro)
                  </button>
                </div>
              </div>
              <button 
                onClick={handleGenerateAll}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                이미지 일괄 생성 시작
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {segments.map((seg, idx) => (
              <div key={seg.id || idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{seg.logicalSections?.join(' | ') || '기획 전략'}</span>
                    <h3 className="text-lg font-bold text-slate-800">{seg.title}</h3>
                  </div>
                  <span className="text-slate-400 font-mono">#0{idx + 1}</span>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">한글 카피 (Key Message)</label>
                  <input 
                    className="w-full p-3 rounded-lg border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium"
                    value={seg.keyMessage}
                    onChange={(e) => updateSegment(idx, 'keyMessage', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">이미지 생성 프롬프트 (Visual Prompt)</label>
                  <textarea 
                    rows={2}
                    className="w-full p-3 rounded-lg border border-slate-100 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700 italic"
                    value={seg.visualPrompt}
                    onChange={(e) => updateSegment(idx, 'visualPrompt', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-2xl mx-auto space-y-10 pb-20">
          <div className="sticky top-4 z-50 flex justify-between items-center bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-blue-50 mb-8">
            <h2 className="text-lg font-bold text-slate-800">결과물 미리보기</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setStep(2)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
              >
                기획안으로 돌아가기
              </button>
              <button 
                onClick={() => window.print()}
                className="px-6 py-2 text-sm bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all"
              >
                전체 저장 (PDF)
              </button>
            </div>
          </div>

          <div className="flex flex-col shadow-2xl rounded-2xl overflow-hidden bg-slate-200">
            {segments.map((seg, idx) => (
              <div key={seg.id || idx} className="relative aspect-[9/16] bg-slate-100 border-b border-slate-200 flex flex-col items-center justify-center overflow-hidden">
                {seg.imageUrl ? (
                  <>
                    <img src={seg.imageUrl} alt={seg.title} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-12 text-center">
                      <p className="text-white text-3xl font-bold leading-tight drop-shadow-lg whitespace-pre-line">
                        {seg.keyMessage}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    {seg.isGenerating ? (
                      <>
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-medium animate-pulse">이미지 생성 중... ({idx + 1}/{segments.length})</p>
                      </>
                    ) : (
                      <p className="text-slate-400">이미지가 없습니다.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center space-y-4 max-w-sm text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <h3 className="text-xl font-bold text-slate-800">AI가 열심히 작업 중입니다</h3>
            <p className="text-slate-500">최상의 팔리는 논리를 구성하고 있습니다. 잠시만 기다려주세요!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailPlanner;
