"use client";

import { useEffect, useRef, useState } from "react";
import type { AuditResult } from "@/lib/audit/types";
import { toAgentPrompt, toTicketsMarkdown } from "@/lib/audit/export";
import { auditExportCopy } from "@/content/audit";
import { buttonClass } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { Icon } from "@/components/ui/Icon";
import { copyText, downloadText, exportFilename } from "./clipboard";

type Done = "tickets" | "prompt" | "download" | "failed" | null;

/** Developer hand-off: copy as tickets, copy as one agent prompt, or download the tickets as .md. */
export function ExportBar({ result, headingId, className }: { result: AuditResult; headingId: string; className?: string }) {
  const [done, setDone] = useState<Done>(null);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function flash(d: Done) {
    setDone(d);
    window.clearTimeout(timer.current);
    if (d !== "failed") timer.current = window.setTimeout(() => setDone(null), 3000);
  }

  async function copy(kind: "tickets" | "prompt") {
    const text = kind === "tickets" ? toTicketsMarkdown(result) : toAgentPrompt(result);
    flash((await copyText(text)) ? kind : "failed");
  }

  function download() {
    try {
      downloadText(toTicketsMarkdown(result), exportFilename(result.hostname, "tickets"));
      flash("download");
    } catch {
      flash("failed");
    }
  }

  const message =
    done === "tickets"
      ? auditExportCopy.copiedTickets
      : done === "prompt"
        ? auditExportCopy.copiedPrompt
        : done === "download"
          ? auditExportCopy.downloaded
          : done === "failed"
            ? auditExportCopy.copyFailed
            : "";
  const btn = buttonClass({ variant: "secondary", size: "sm", className: "h-auto! min-h-9 w-full justify-start py-2 text-left whitespace-normal! sm:w-auto" });

  return (
    <section
      aria-labelledby={headingId}
      className={cx("rounded-panel bg-white p-5 shadow-paper ring-1 ring-ink/[0.04] sm:p-7", className)}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 xl:max-w-md">
          <h4 id={headingId} className="font-serif text-[1.5rem] leading-tight text-ink">
            {auditExportCopy.title}
          </h4>
          <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted">{auditExportCopy.helper}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button type="button" className={btn} onClick={() => void copy("tickets")}>
            <Icon name={done === "tickets" ? "check" : "list"} size={15} className="shrink-0" />
            {auditExportCopy.copyTickets}
          </button>
          <button type="button" className={btn} onClick={() => void copy("prompt")}>
            <Icon name={done === "prompt" ? "check" : "bot"} size={15} className="shrink-0" />
            {auditExportCopy.copyPrompt}
          </button>
          <button type="button" className={btn} onClick={download}>
            <Icon name={done === "download" ? "check" : "file"} size={15} className="shrink-0" />
            {auditExportCopy.download}
          </button>
        </div>
      </div>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={cx("mt-3 min-h-5 text-sm", done === "failed" ? "text-critical" : "text-pass")}
      >
        {message}
      </p>
    </section>
  );
}
