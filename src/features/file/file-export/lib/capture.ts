import * as htmlToImage from "html-to-image";
import { ExportFormat } from "./types";

export const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const captureNodeToBlob = async (
  node: HTMLElement,
  format: ExportFormat,
  opts?: { scale?: number; webpQuality?: number; jpgQuality?: number }
): Promise<Blob> => {
  const scale = opts?.scale ?? 2;
  const webpQuality = opts?.webpQuality ?? 0.9;
  const jpgQuality = opts?.jpgQuality ?? 0.95;

  let dataUrl: string;

  if (format === "webp") {
    const canvas = await htmlToImage.toCanvas(node, {
      pixelRatio: scale,
      backgroundColor: "#ffffff",
    });
    dataUrl = canvas.toDataURL("image/webp", webpQuality);
  } else {
    dataUrl = await htmlToImage.toJpeg(node, {
      pixelRatio: scale,
      quality: jpgQuality,
      backgroundColor: "#ffffff",
    });
  }

  return await (await fetch(dataUrl)).blob();
};
