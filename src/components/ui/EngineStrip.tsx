import Image from "next/image";
import { useId } from "react";
import { cx } from "./cx";
import { EngineStripToggle } from "./EngineStripToggle";

/**
 * Official marks, keyed by the engine names in `site.enginesTracked`.
 * Sources and trademark notes: docs/ASSETS.md ("Engine logos"). Width/height are
 * the rendered CSS size at a 24 px logo height (from each SVG's viewBox), so
 * nothing shifts while the files load. An engine without an entry renders as a
 * text label only.
 */
const LOGOS: Record<string, { src: string; width: number; height: number }> = {
  ChatGPT: { src: "/logos/chatgpt.svg", width: 24, height: 24 },
  Perplexity: { src: "/logos/perplexity.svg", width: 24, height: 24 },
  Claude: { src: "/logos/claude.svg", width: 24, height: 24 },
  Gemini: { src: "/logos/gemini.svg", width: 24, height: 24 },
  "Google AI Overviews": { src: "/logos/google.svg", width: 24, height: 24 },
  "Microsoft Copilot": { src: "/logos/copilot.svg", width: 26, height: 24 },
  "Google Search": { src: "/logos/google.svg", width: 24, height: 24 },
  Bing: { src: "/logos/bing.svg", width: 16, height: 24 },
};

function EngineList({ engines, label, hidden }: { engines: readonly string[]; label?: string; hidden?: boolean }) {
  return (
    <ul aria-label={label} aria-hidden={hidden || undefined} className="engine-strip-list">
      {engines.map((name) => {
        const logo = LOGOS[name];
        return (
          <li key={name} className="engine-strip-item">
            {logo ? (
              <Image
                src={logo.src}
                width={logo.width}
                height={logo.height}
                alt=""
                unoptimized
                loading="lazy"
                className="shrink-0"
                style={{ width: logo.width, height: logo.height }}
              />
            ) : null}
            <span className="text-[0.9375rem] leading-none font-medium tracking-[-0.01em] whitespace-nowrap text-ink-2">
              {name}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Bordered strip of the engines we check against: official logo + product name.
 * CSS-only marquee (one track, list duplicated once, the copy aria-hidden),
 * paused on hover, focus-within and by the pause button. Reduced motion: static
 * wrapped row, no copy, no button. Overflow is clipped inside the strip.
 * Styles: `.engine-strip*` in globals.css.
 */
export function EngineStrip({
  label,
  engines,
  disclaimer,
  className,
}: {
  label: string;
  engines: readonly string[];
  disclaimer: string;
  className?: string;
}) {
  const trackId = useId();
  return (
    <div className={cx("engine-strip", className)}>
      <p className="text-center text-kicker font-semibold text-muted uppercase">{label}</p>
      <div className="engine-strip-viewport mt-6 border-y border-line">
        <div id={trackId} className="engine-strip-track">
          <EngineList engines={engines} label={label} />
          <EngineList engines={engines} hidden />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        <p className="max-w-md text-center text-xs leading-relaxed text-balance text-muted">{disclaimer}</p>
        <EngineStripToggle controls={trackId} />
      </div>
    </div>
  );
}
