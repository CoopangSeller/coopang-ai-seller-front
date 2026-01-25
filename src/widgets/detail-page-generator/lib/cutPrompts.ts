// widgets/detail-page-generator/lib/prompts.ts
import { DetailShotKey } from "@/shared/types/types";

function safeLine(s: string, max = 400) {
  return (s ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

export function buildCutPrompt(args: {
  shot: DetailShotKey;
  productName: string;
  category: string;
  usp: string;
  intent: string;
}) {
  const { shot, productName, category, usp, intent } = args;

  const base = [
    `Create a professional ecommerce image for "${safeLine(productName, 80)}" (${safeLine(category, 40)}).`,
    "High sharpness, clean edges, realistic materials.",
    "No duplicated products. No distorted shapes. No broken anatomy.",
    "No brand logos. No readable text generated inside the image.",
    "Clean composition, product clarity first.",
  ];

  const shotBlock =
    shot === "cutout"
      ? [
          "CUTOUT SHOT: pure white seamless background.",
          "Single product hero, 3/4 angle, centered composition.",
          "Soft studio lighting with subtle shadow.",
        ]
      : shot === "lifestyle"
        ? [
            "LIFESTYLE SHOT: minimal clean lifestyle scene.",
            "Natural daylight with soft fill light.",
            "Product must be dominant, props max 1.",
          ]
        : [
            "MODEL SHOT: include one professional adult model.",
            "Natural pose, clean styling, ecommerce advertising style.",
            "Product remains the main focus.",
          ];

  const uspLine = safeLine(usp, 800)
    ? `Visually emphasize these features: ${safeLine(
        usp.replace(/\n/g, " ").replace(/-/g, ""),
        500,
      )}.`
    : "";

  const intentLine = safeLine(intent, 800)
    ? `User intent: ${safeLine(intent, 500)}.`
    : "";

  return [...base, ...shotBlock, uspLine, intentLine].filter(Boolean).join(" ");
}
