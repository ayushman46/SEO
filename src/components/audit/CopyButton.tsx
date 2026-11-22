"use client";

import { useEffect, useRef, useState } from "react";
import { auditAiCopy } from "@/content/audit";
import { buttonClass } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { Icon } from "@/components/ui/Icon";
import { copyText } from "./clipboard";

type CopyState = "idle" | "copied" | "failed";

/**
 * Copy-to-clipboard button with its own polite live region. `label` names what is copied
 * for screen readers ("Copy Title tag"); the visible text stays short.
 */
export function CopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function onClick() {
    const ok = await copyText(text);
    setState(ok ? "copied" : "failed");
    window.clearTimeout(timer.current);
    if (ok) timer.current = window.setTimeout(() => setState("idle"), 2500);
  }

  return (
    <span className={cx("inline-flex flex-col items-end gap-1", className)}>
      <button type="button" onClick={onClick} className={buttonClass({ variant: "secondary", size: "sm" })}>
        <Icon name={state === "copied" ? "check" : "file"} size={15} className="shrink-0" />
        {/* Both words share one grid cell so the button keeps its width when the text swaps. */}
        <span aria-hidden className="grid text-left">
          <span className={cx("[grid-area:1/1]", state === "copied" && "invisible")}>{auditAiCopy.copy}</span>
          <span className={cx("[grid-area:1/1]", state !== "copied" && "invisible")}>{auditAiCopy.copied}</span>
        </span>
        <span className="sr-only">
          {auditAiCopy.copy} {label}
        </span>
      </button>
      <span role="status" aria-live="polite" aria-atomic="true" className={state === "failed" ? "max-w-[16rem] text-right text-xs text-critical" : "sr-only"}>
        {state === "copied" ? auditAiCopy.copied : state === "failed" ? auditAiCopy.copyFailed : ""}
      </span>
    </span>
  );
}
