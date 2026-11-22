import { outcome, type Check } from "../../context";

const def = { id: "geo.llms-txt", category: "geo", label: "llms.txt" } as const;

export function isValidLlmsTxt(text: string): boolean {
  const firstLine = text.replace(/^﻿/, "").trimStart().split(/\r?\n/, 1)[0] ?? "";
  return /^# \S/.test(firstLine);
}

export const llmsTxtCheck: Check = (ctx) => {
  const l = ctx.llms;
  if (l.status !== "ok" || !l.text) {
    return outcome(def, {
      score: 0,
      status: "warn",
      summary: "No /llms.txt file was found.",
      issues: [{ key: "geo.llms-txt:missing" }],
    });
  }
  if (!isValidLlmsTxt(l.text)) {
    return outcome(def, {
      score: 0.5,
      summary: "/llms.txt exists but doesn't start with a `# Title` line.",
      issues: [{ key: "geo.llms-txt:invalid-format", affectedUrls: [l.url] }],
    });
  }
  return outcome(def, { score: 1, summary: "/llms.txt exists and follows the expected format.", issues: [] });
};
