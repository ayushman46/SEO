/**
 * Manual audit runner: npx tsx scripts/audit-cli.ts https://example.com [--json | --tickets | --agent-prompt]
 * Prints a human summary (or the full AuditResult with --json).
 *
 * The engine imports "server-only", which throws unless Node resolves the
 * "react-server" export condition, so the script re-launches itself with it.
 */
import { spawnSync } from "node:child_process";

const hasCondition = process.execArgv.some((a) => a.includes("react-server"));
if (!hasCondition) {
  const r = spawnSync(
    process.execPath,
    [...process.execArgv, "--conditions=react-server", process.argv[1], ...process.argv.slice(2)],
    { stdio: "inherit" },
  );
  process.exit(r.status ?? 1);
} else {
  void main();
}

async function main() {
  const { runAudit, toPartialReport, AuditError } = await import("../src/lib/audit");
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const url = args.find((a) => !a.startsWith("--"));
  if (!url) {
    console.error("Usage: npx tsx scripts/audit-cli.ts <url> [--json | --tickets | --agent-prompt]");
    process.exit(2);
  }
  try {
    const result = await runAudit(url);
    if (json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    if (args.includes("--tickets") || args.includes("--agent-prompt")) {
      const { toTicketsMarkdown, toAgentPrompt } = await import("../src/lib/audit/export");
      console.log(args.includes("--tickets") ? toTicketsMarkdown(result) : toAgentPrompt(result));
      return;
    }
    const partial = toPartialReport(result);
    const s = result.scores;
    console.log(`\nnoticr audit — ${result.finalUrl}`);
    console.log(`  duration ${(result.durationMs / 1000).toFixed(1)} s · pages ${result.pages.length} · truncated ${result.truncated}`);
    console.log(`  scores  overall ${s.overall} · seo ${s.seo} · geo ${s.geo} · performance ${s.performance ?? "n/a"}`);
    if (result.coreWebVitals) {
      const v = result.coreWebVitals;
      console.log(`  cwv     score ${v.performanceScore} · LCP ${v.lcpMs} ms · CLS ${v.cls} · TBT ${v.tbtMs} ms · INP ${v.inpMs ?? "n/a"} ms`);
    }
    console.log(`  issues  ${JSON.stringify(partial.issueCounts)}`);
    const platformNote = result.notes.find((n) => n.startsWith("Detected platform: "));
    const withSteps = result.issues.filter((i) => /\n\n(On|In|If your site runs on|If you use) [^:\n]{1,60}: /.test(i.howToFix));
    console.log(
      `  platform ${platformNote ? platformNote.slice("Detected platform: ".length).split(". ")[0].replace(/\.$/, "") : "not detected"}` +
        (withSteps.length ? ` · platform steps on ${withSteps.length} ${withSteps.length === 1 ? "fix" : "fixes"}:${withSteps.map((i) => i.id).join(", ")}` : ""),
    );
    console.log("\nChecks:");
    for (const c of result.checks) {
      console.log(`  [${c.status.padEnd(11)}] ${c.id.padEnd(26)} ${c.score.toFixed(2)}  ${c.summary}`);
    }
    console.log("\nIssues (sorted):");
    for (const i of result.issues) {
      console.log(`  ${i.severity.padEnd(8)} ${String(i.impact).padStart(5)} pts  ${i.id} — ${i.title}`);
    }
    console.log("\nPages:");
    for (const p of result.pages) {
      console.log(`  ${p.statusCode} ${p.indexable ? "idx " : "NOIDX"} h1=${p.h1Count} words=${p.wordCount} issues=${p.issueCount}  ${p.url}`);
    }
    if (result.notes.length) {
      console.log("\nNotes:");
      for (const n of result.notes) console.log(`  - ${n}`);
    }
    console.log("");
    if (!process.env.NVIDIA_API_KEY?.trim()) {
      console.log("AI insights: skipped (NVIDIA_API_KEY not set)");
    } else if (!result.ai) {
      console.log("AI insights: unavailable for this run (see notes)");
    } else {
      const ai = result.ai;
      console.log(`AI insights (how an AI model reads your site; model ${ai.model}):`);
      console.log(`  clarity ${ai.clarityScore}/100 · business type: ${ai.businessType ?? "unclear"}`);
      console.log(`  readback: ${ai.readback}`);
      console.log("  facts:");
      for (const f of ai.facts) console.log(`    [${f.status.padEnd(7)}] ${f.label}: ${f.value ?? "-"}`);
      console.log("  questions:");
      for (const q of ai.questions) {
        console.log(`    [${q.answered.padEnd(6)}] ${q.question}${q.sourceUrl ? `  (${q.sourceUrl})` : ""}`);
        console.log(`             ${q.note}`);
      }
      console.log("  drafts:");
      for (const [k, v] of Object.entries(ai.drafts)) {
        if (v === null) {
          console.log(`    ${k}: (none)`);
          continue;
        }
        console.log(`    ${k}:`);
        for (const line of String(v).split("\n")) console.log(`      ${line}`);
      }
    }
    console.log(`\nPartial report: ${partial.topIssues.length} top issues, ${partial.lockedIssues.length} locked${partial.ai ? `, AI teaser with ${partial.ai.sampleQuestions.length} sample questions and ${partial.ai.lockedDrafts.length} locked drafts` : ""}.`);
  } catch (err) {
    if (err instanceof AuditError) {
      console.error(`AuditError(${err.code}): ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}
