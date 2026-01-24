import React from "react";
import { detailTheme } from "@/shared/config/detailTheme";

type Props = {
  imageUrl: string;
  title?: string;
  label?: string;
  headline?: string;
  subcopy?: string;
  bullets?: string[];
};

/**
 * MD rule enforcement:
 * - No text overlay on the image (image-only block)
 * - Image:Text ratio = ~75:25A
 * - Unified theme (accent/text colors)
 */
const SectionLayout: React.FC<Props> = ({
  imageUrl,
  title,
  label,
  headline,
  subcopy,
  bullets,
}) => {
  const safeBullets = (bullets ?? []).filter(Boolean).slice(0, 3);

  return (
    <div
      className="w-full h-full bg-white flex flex-col"
      style={{
        backgroundColor: detailTheme.bg,
        color: detailTheme.text,
      }}
    >
      {/* Image block (75%) */}
      <div className="relative flex-[3] overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          alt={title || headline || "section"}
          className="absolute inset-0 w-full h-full object-cover"
          crossOrigin="anonymous"
        />
        {/* intentionally no text overlay */}
      </div>

      {/* Text block (25%) */}
      <div
        className="flex-[1] px-6 py-5 flex flex-col justify-center gap-2 border-t"
        style={{ borderColor: detailTheme.line }}
      >
        {label ? (
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide"
              style={{
                backgroundColor: detailTheme.accentSoft,
                color: detailTheme.accent,
              }}
            >
              {label}
            </span>
          </div>
        ) : null}

        {headline ? (
          <div className="text-xl leading-tight font-black">{headline}</div>
        ) : null}

        {subcopy ? (
          <div
            className="text-sm font-semibold leading-snug"
            style={{ color: detailTheme.subText }}
          >
            {subcopy}
          </div>
        ) : null}

        {safeBullets.length ? (
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1.5">
            {safeBullets.map((b, i) => (
              <div key={i} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: detailTheme.accent }}
                />
                <span
                  className="text-[12px] font-extrabold"
                  style={{ color: detailTheme.subText }}
                >
                  {b}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SectionLayout;
