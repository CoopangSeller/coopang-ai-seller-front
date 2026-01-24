// widgets/detail-page-generator/lib/usp.ts
export async function tryServerCrawl(url: string): Promise<string | null> {
  try {
    const res = await fetch("/api/usp/crawl", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.text === "string" ? data.text : null;
  } catch {
    return null;
  }
}

export function heuristicUspFromPaste(paste: string): string {
  const raw = (paste ?? "").trim();
  if (!raw) return "";

  const parts = raw
    .split(/\n|•|-|\*|▪|\.|,|\/|\|/g)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((s) => s.length >= 6)
    .slice(0, 10);

  const picked = parts.slice(0, 6);
  if (picked.length === 0) return "";
  return picked.map((x) => `- ${x}`).join("\n");
}
