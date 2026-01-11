import { useMemo, useState } from "react";

export const MAX_REFERENCE_IMAGES = 5;

export const useReferenceImages = () => {
  const [images, setImages] = useState<string[]>([]);

  const remaining = useMemo(
    () => Math.max(0, MAX_REFERENCE_IMAGES - images.length),
    [images.length]
  );

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const addFiles = async (files: FileList | null) => {
    if (!files) return;

    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );

    const toAdd = imageFiles.slice(0, remaining);
    const base64List = await Promise.all(toAdd.map(readFileAsDataUrl));

    setImages((prev) => [...prev, ...base64List]);
  };

  const remove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const clear = () => setImages([]);

  return {
    images,
    remaining,
    addFiles,
    remove,
    clear,
    max: MAX_REFERENCE_IMAGES,
  };
};
