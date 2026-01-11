import React from "react";

const MAX_IMAGES = 5;

type Props = {
  value: string[];
  onChange: (images: string[]) => void;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const ReferenceImageUpload: React.FC<Props> = ({ value, onChange }) => {
  const remaining = Math.max(0, MAX_IMAGES - value.length);

  const addFiles = async (files: FileList | null) => {
    if (!files) return;

    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    const toAdd = imageFiles.slice(0, remaining);
    if (toAdd.length === 0) {
      alert(`참고 이미지는 최대 ${MAX_IMAGES}장까지 업로드 가능합니다.`);
      return;
    }

    const base64List = await Promise.all(toAdd.map(readFileAsDataUrl));
    onChange([...value, ...base64List]);
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const clear = () => onChange([]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700">
          제품 원본 사진 업로드 (선택)
        </label>

        {value.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
          >
            전체 삭제
          </button>
        )}
      </div>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
        className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      <div className="text-xs text-slate-500">
        {value.length > 0
          ? `선택됨: ${value.length} / ${MAX_IMAGES}장`
          : `선택된 파일 없음 (최대 ${MAX_IMAGES}장)`}
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3 pt-2">
          {value.map((src, idx) => (
            <div
              key={`${src.slice(0, 30)}-${idx}`}
              className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
            >
              <img
                src={src}
                alt={`reference-${idx}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg hover:bg-black/75"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferenceImageUpload;
