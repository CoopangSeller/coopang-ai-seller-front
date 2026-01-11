
import React from 'react';
import { ProductInfo, PageLength } from '../../types';

interface Props {
  info: ProductInfo;
  setInfo: React.Dispatch<React.SetStateAction<ProductInfo>>;
  onNext: () => void;
}

const Step1Input: React.FC<Props> = ({ info, setInfo, onNext }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInfo(prev => ({ ...prev, referenceImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSelection = (field: 'targetGender' | 'targetAge', value: string) => {
    setInfo(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(v => v !== value) 
        : [...prev[field], value]
    }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">1단계: 상품 정보 입력</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">상품명</label>
          <input 
            type="text" 
            placeholder="예: 초경량 티타늄 텀블러"
            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            value={info.name}
            onChange={e => setInfo({ ...info, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">카테고리</label>
          <select 
            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            value={info.category}
            onChange={e => setInfo({ ...info, category: e.target.value })}
          >
            <option value="">선택해주세요</option>
            <option value="패션">패션/의류</option>
            <option value="식품">식품</option>
            <option value="리빙">리빙/가구</option>
            <option value="디지털">디지털/가전</option>
            <option value="뷰티">뷰티</option>
            <option value="기타">기타</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">핵심 특징 (USP)</label>
        <textarea 
          rows={4}
          placeholder="상품의 가장 큰 장점들을 적어주세요. (예: 24시간 보온 보냉, 150g의 가벼운 무게...)"
          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
          value={info.features}
          onChange={e => setInfo({ ...info, features: e.target.value })}
        />
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">타겟 설정</label>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['남성', '여성', '전체'].map(g => (
              <button
                key={g}
                onClick={() => toggleSelection('targetGender', g)}
                className={`px-4 py-2 rounded-full border text-sm transition-all ${info.targetGender.includes(g) ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-400'}`}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {['10대', '20대', '30대', '40대', '50대', '60대+'].map(age => (
              <button
                key={age}
                onClick={() => toggleSelection('targetAge', age)}
                className={`px-4 py-2 rounded-full border text-sm transition-all ${info.targetAge.includes(age) ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-400'}`}
              >
                {age}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">레퍼런스 제품 이미지 (선택)</label>
        <div className="flex items-center gap-4">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {info.referenceImage && (
            <img src={info.referenceImage} alt="Ref" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
          )}
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">상세페이지 길이</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.values(PageLength)).map(len => (
            <button
              key={len}
              onClick={() => setInfo({ ...info, pageLength: len as PageLength })}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${info.pageLength === len ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-100' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'}`}
            >
              {len === PageLength.AUTO ? 'AI 추천' : `${len}장 (${len === '5' ? 'Short' : len === '7' ? 'Standard' : 'Long'})`}
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={onNext}
        disabled={!info.name || !info.category}
        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1"
      >
        기획안 생성하기
      </button>
    </div>
  );
};

export default Step1Input;
