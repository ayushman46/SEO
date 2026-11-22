/** Tiny className joiner (no tailwind-merge: we avoid conflicting utilities by construction). */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
