import robotsParser from "robots-parser";
import type { FetchedText } from "./context";

export type Robots = ReturnType<typeof robotsParser>;

export const OUR_BOT = "noticrbot";

/** Parsed robots.txt, or null when there is none / it couldn't be read. */
export function parseRobots(robots: FetchedText): Robots | null {
  if (robots.status !== "ok" || robots.text === null) return null;
  // Rules fetched through a redirect apply to the original host (RFC 9309). robots-parser
  // returns undefined (= "allowed") for URLs on another origin, so bind it to the requested URL.
  return robotsParser(robots.requestedUrl ?? robots.url, robots.text);
}

/** true only when robots.txt explicitly disallows `url` for `ua`. */
export function isBlocked(robots: Robots | null, url: string, ua: string): boolean {
  if (!robots) return false;
  return robots.isAllowed(url, ua) === false;
}

/** Plausibility check: a robots.txt that is actually an HTML page (soft 404) doesn't count. */
export function looksLikeRobotsTxt(text: string): boolean {
  const head = text.slice(0, 2048).trimStart().toLowerCase();
  if (head.startsWith("<!doctype") || head.startsWith("<html") || /<html[\s>]/.test(head)) return false;
  return true;
}
