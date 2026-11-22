"use client";

import { useState } from "react";

/**
 * Pause / play control for the engine logo marquee (WCAG 2.2.2). Only owns its
 * own state: globals.css pauses the track with
 * `.engine-strip:has([data-marquee-toggle][data-paused="true"])`.
 */
export function EngineStripToggle({ controls }: { controls: string }) {
  const [paused, setPaused] = useState(false);
  const label = paused ? "Play scrolling logos" : "Pause scrolling logos";
  return (
    <button
      type="button"
      data-marquee-toggle
      data-paused={paused ? "true" : "false"}
      aria-controls={controls}
      aria-label={label}
      title={label}
      onClick={() => setPaused((p) => !p)}
      className="engine-strip-toggle inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line-strong bg-white text-ink-2 transition-colors hover:border-ink hover:text-ink"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false" fill="currentColor">
        {paused ? <path d="M3.5 1.8v10.4L12 7 3.5 1.8Z" /> : <path d="M3 1.5h2.75v11H3zM8.25 1.5H11v11H8.25z" />}
      </svg>
    </button>
  );
}
