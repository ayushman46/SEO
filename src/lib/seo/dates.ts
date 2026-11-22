import { contentUpdated, lastUpdatedLabel } from "@/content/site";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * "2026-11-22" -> "22 November 2026". Pure string parsing (no Date, no locale),
 * so it is deterministic at build time and safe under Cache Components.
 */
export function formatContentDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const month = MONTHS[Number(m[2]) - 1];
  if (!month) return iso;
  return `${Number(m[3])} ${month} ${m[1]}`;
}

/**
 * Everything a page needs for its visible date line:
 * <p>{u.label} <time dateTime={u.iso}>{u.display}</time></p>  ->  "Last updated 22 November 2026"
 */
export function lastUpdated(iso: string = contentUpdated): { label: string; iso: string; display: string } {
  return { label: lastUpdatedLabel, iso, display: formatContentDate(iso) };
}
