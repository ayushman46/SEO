import type { CheerioAPI } from "cheerio";
import { outcome, plural, type Check, type IssueSeed } from "../../context";
import { cleanText, countWords, domRoot, firstDescendant, isElement, textOf, walk, SKIP, type DomNode, type PageData } from "../../html";

const def = { id: "geo.answer-ready", category: "geo", label: "Answer-ready content" } as const;

const SUMMARY_HEADING = /\b(tl;?\s?dr|summary|key takeaways?|takeaways|in short|at a glance|in brief|quick answer|the short answer|bottom line)\b/i;
const SUMMARY_SELECTOR =
  '[class*="tldr" i], [id*="tldr" i], [class*="tl-dr" i], [class*="key-takeaways" i], [id*="key-takeaways" i], [class*="takeaways" i], [class*="article-summary" i], [class*="post-summary" i]';

function sentenceCount(text: string): number {
  const m = text.match(/[.!?](\s|$)|[。！？]/g);
  return Math.max(1, m ? m.length : 0);
}

/** Paragraph of 20–60 words and 1–3 sentences: short enough to quote, long enough to answer. */
export function isAnswerParagraph(text: string): boolean {
  const t = cleanText(text);
  const words = countWords(t);
  return words >= 20 && words <= 60 && sentenceCount(t) <= 3;
}

/** Only the first headings matter (3 blocks give full marks); caps work on hostile pages. */
const MAX_HEADINGS = 200;
const CHROME = new Set(["nav", "footer", "header"]);

function nextElement(n: DomNode): DomNode | null {
  for (let s = n.next; s; s = s.next) if (isElement(s)) return s;
  return null;
}
function prevElement(n: DomNode): DomNode | null {
  for (let s = n.prev; s; s = s.prev) if (isElement(s)) return s;
  return null;
}

/** Number of headings (H1–H3) directly followed by an answer-style paragraph. */
export function countAnswerBlocks($: CheerioAPI): number {
  // Collect H1–H3 outside nav/header/footer in one linear walk.
  const headings: DomNode[] = [];
  walk(domRoot($).children ?? [], false, (n, inChrome) => {
    if (!isElement(n) || headings.length >= MAX_HEADINGS) return SKIP;
    if (!inChrome && (n.name === "h1" || n.name === "h2" || n.name === "h3")) headings.push(n);
    return inChrome || CHROME.has(n.name);
  });

  let count = 0;
  for (const h of headings) {
    const candidates: (DomNode | null)[] = [nextElement(h)];
    // Heading wrapped alone in a container: look at the container's next sibling too.
    if (!prevElement(h) && !nextElement(h) && h.parent) candidates.push(nextElement(h.parent));
    for (const c of candidates) {
      if (!c) continue;
      const p = c.name === "p" ? c : firstDescendant(c, "p");
      // 60 words never need more than a few thousand characters.
      if (p && isAnswerParagraph(textOf(p, 3_000))) {
        count++;
        break;
      }
    }
  }
  return count;
}

export function hasSummary(p: PageData): boolean {
  if (p.headings.some((h) => SUMMARY_HEADING.test(h.text))) return true;
  return p.$(SUMMARY_SELECTOR).not("summary").length > 0;
}

interface ListFlags {
  inMain: boolean;
  inChrome: boolean;
  /** tr counter of the nearest enclosing table */
  table: { rows: number; inMain: boolean } | null;
}

/**
 * A real list (3+ items, outside nav/header/footer) or a table (2+ rows) in the main
 * content (main/article/[role=main] when present, else the whole body). Single linear walk.
 */
export function hasListsOrTables($: CheerioAPI): boolean {
  let hasMain = false;
  let listMain = false;
  let listAny = false;
  let tableMain = false;
  let tableAny = false;
  walk<ListFlags>(domRoot($).children ?? [], { inMain: false, inChrome: false, table: null }, (n, f) => {
    if (!isElement(n)) return SKIP;
    const isMain = n.name === "main" || n.name === "article" || n.attribs.role === "main";
    if (isMain) hasMain = true;
    const inMain = f.inMain || isMain;
    const inChrome = f.inChrome || CHROME.has(n.name);
    if ((n.name === "ul" || n.name === "ol") && !inChrome) {
      let items = 0;
      for (const c of n.children) if (isElement(c) && c.name === "li" && ++items >= 3) break;
      if (items >= 3) {
        listAny = true;
        // Descendant-of-main only, like root.find(): the main element itself never is a list.
        if (f.inMain) listMain = true;
      }
    }
    let table = f.table;
    if (n.name === "table") table = { rows: 0, inMain: f.inMain };
    else if (n.name === "tr" && table && ++table.rows >= 2) {
      tableAny = true;
      if (table.inMain) tableMain = true;
    }
    return { inMain, inChrome, table };
  });
  return hasMain ? listMain || tableMain : listAny || tableAny;
}

export const answerReadyCheck: Check = (ctx) => {
  let blocks = 0;
  let summary = false;
  let lists = false;
  for (const p of ctx.pages) {
    blocks += countAnswerBlocks(p.$);
    summary ||= hasSummary(p);
    lists ||= hasListsOrTables(p.$);
  }
  const blockScore = Math.min(1, blocks / 3);
  const score = 0.5 * blockScore + 0.2 * (summary ? 1 : 0) + 0.3 * (lists ? 1 : 0);

  const issues: IssueSeed[] = [];
  if (blocks < 3) {
    issues.push({
      key: "geo.answer-ready:no-answer-blocks",
      share: 2.5,
      ...(blocks > 0
        ? { severity: "low" as const, detail: `We found only ${plural(blocks, "heading")} followed by a short, direct answer.` }
        : {}),
    });
  }
  if (!summary) issues.push({ key: "geo.answer-ready:no-summary", share: 1 });
  if (!lists) issues.push({ key: "geo.answer-ready:no-lists", share: 1.5 });

  const parts = [
    `${plural(blocks, "answer-style section")}`,
    summary ? "a summary" : "no summary",
    lists ? "lists/tables present" : "no lists or tables",
  ];
  return outcome(def, { score, summary: `Found ${parts.join(", ")}.`, issues });
};
