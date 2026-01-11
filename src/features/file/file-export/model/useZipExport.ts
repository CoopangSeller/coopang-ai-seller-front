import { useMemo, useState } from "react";
import { saveAs } from "file-saver";
import { ExportFormat, ExportProgress } from "../lib/types";
import { captureNodeToBlob, nextFrame, sleep } from "../lib/capture";
import { buildZipBlob, sanitizeFolderName } from "../lib/zip";

type Params = {
  // 캡처할 DOM들
  nodes: (HTMLElement | null)[];
  // 이미지가 생성된 페이지만 골라내기 위한 predicate
  shouldInclude?: (index: number) => boolean;
  // zip 파일/폴더명
  baseName?: string;
  // 옵션
  scale?: number;
  webpQuality?: number;
  jpgQuality?: number;
};

export const useZipExport = () => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<ExportProgress>({
    current: 0,
    total: 0,
    phase: "idle",
  });

  const exportZip = async (format: ExportFormat, params: Params) => {
    const baseNameRaw = params.baseName?.trim() || "detail_pages";
    const folderName = sanitizeFolderName(baseNameRaw);

    try {
      setDownloading(true);

      const targets = params.nodes
        .map((node, i) => ({ node, i }))
        .filter(
          (x) =>
            x.node && (params.shouldInclude ? params.shouldInclude(x.i) : true)
        );

      setProgress({ current: 0, total: targets.length, phase: "capture" });

      await nextFrame();
      await sleep(30);

      const files: Array<{ name: string; blob: Blob }> = [];

      for (let k = 0; k < targets.length; k++) {
        const { node, i } = targets[k];
        if (!node) continue;

        setProgress({ current: k + 1, total: targets.length, phase: "capture" });
        await nextFrame();

        const blob = await captureNodeToBlob(node, format, {
          scale: params.scale,
          webpQuality: params.webpQuality,
          jpgQuality: params.jpgQuality,
        });

        const ext = format === "webp" ? "webp" : "jpg";
        files.push({
          name: `detail_${String(i + 1).padStart(2, "0")}.${ext}`,
          blob,
        });
      }

      setProgress((p) => ({ ...p, phase: "zip" }));
      await nextFrame();

      const zipBlob = await buildZipBlob(folderName, files);
      saveAs(zipBlob, `${folderName}_${format}.zip`);

      setProgress((p) => ({ ...p, phase: "done" }));
      await sleep(200);
    } finally {
      setDownloading(false);
      setProgress({ current: 0, total: 0, phase: "idle" });
    }
  };

  return useMemo(
    () => ({ downloading, progress, exportZip }),
    [downloading, progress]
  );
};
