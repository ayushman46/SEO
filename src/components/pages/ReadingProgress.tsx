/**
 * Thin reading-progress bar for long documents (methodology, /bot, legal).
 * Server component with no script: a fixed hairline scaled by a CSS
 * scroll-driven animation (globals.css `.reading-progress`). Hidden where
 * scroll timelines are unsupported and under reduced motion. Decorative:
 * the in-page nav already tells assistive tech where the reader is.
 */
export function ReadingProgress() {
  return (
    <div
      aria-hidden
      className="reading-progress pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-accent"
    />
  );
}
