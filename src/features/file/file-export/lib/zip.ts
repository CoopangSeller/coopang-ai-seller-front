import JSZip from "jszip";

export const sanitizeFolderName = (name: string) =>
  name.trim().replace(/[\\/:*?"<>|]/g, "_");

export const buildZipBlob = async (
  folderName: string,
  files: Array<{ name: string; blob: Blob }>
) => {
  const zip = new JSZip();
  const folder = zip.folder(folderName) ?? zip;

  for (const f of files) {
    folder.file(f.name, f.blob);
  }

  return await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
};
