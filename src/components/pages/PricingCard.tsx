import type { PricingTier } from "@/content/types";
import { Button } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { Icon } from "@/components/ui/Icon";
import { PlaceholderText } from "@/components/ui/PlaceholderText";
import { PriceText } from "./PriceText";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** "From $99" -> prefix "From", figure "$99"; "₹3,999 per location" -> figure "₹3,999", suffix "per location". */
export function splitPriceParts(price: string) {
  const m = /^(From\s+)?([$₹][\d,]+(?:\.\d+)?)(.*)$/.exec(price.trim());
  if (!m) return { prefix: "", figure: price.trim(), suffix: "" };
  return { prefix: (m[1] ?? "").trim(), figure: m[2], suffix: m[3].trim() };
}

/** How many features show before the rest fold into "Everything included". */
const VISIBLE_FEATURES = 4;

/**
 * One column of the pricing rate card (signature moment 3, T026). No card chrome:
 * the sheet draws the rules. From md the article is a five-row CSS subgrid of the
 * sheet (name, price, description, features, action), so figures, rules and the first
 * feature sit on one line across side-by-side columns, and stacked columns carry no
 * reserved blank space (R5 #7); "From" sits above the figure in small caps, any
 * suffix ("per location") and the cadence beside it, all tabular. The highlighted
 * tier is marked typographically (white ground, a 2 px accent rule, a text label
 * that also describes it to screen readers), never by colour alone. Actions are
 * quiet text links; the sheet has one primary action below it.
 */
export function PricingCard({
  tier,
  highlightLabel,
  idSuffix,
}: {
  tier: PricingTier;
  highlightLabel: string;
  /** Keeps ids unique when the same tiers are rendered twice (e.g. USD and INR price sets). */
  idSuffix?: string;
}) {
  const id = `tier-${slugify(tier.name)}${idSuffix ? `-${idSuffix}` : ""}`;
  const hi = Boolean(tier.highlighted);
  const price = splitPriceParts(tier.price);
  const shown = tier.features.length > VISIBLE_FEATURES + 1 ? tier.features.slice(0, VISIBLE_FEATURES) : tier.features;
  const more = tier.features.slice(shown.length);

  const feature = (f: string) => (
    <li key={f} className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-pretty text-ink-2">
      <Icon name="check" size={16} strokeWidth={2} className="mt-1 shrink-0 text-ink-2" />
      <PlaceholderText value={f} />
    </li>
  );

  return (
    <article
      aria-labelledby={`${id}-name`}
      aria-describedby={hi ? `${id}-label` : undefined}
      className={cx("relative flex h-full flex-col p-6 md:row-span-5 md:grid md:grid-rows-subgrid xl:p-7", hi && "bg-white")}
    >
      {hi ? <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-accent" /> : null}
      <div className="flex min-h-6 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id={`${id}-name`} className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink">
          {tier.name}
        </h3>
        {hi ? (
          <span id={`${id}-label`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-ink">
            <Icon name="eye" size={14} />
            {highlightLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col justify-end md:mt-5">
        {price.prefix ? (
          <span className="text-xs font-semibold tracking-[0.1em] text-muted uppercase">{price.prefix}</span>
        ) : null}
        <p className="flex flex-wrap items-baseline gap-x-2">
          <PriceText value={price.figure} className="font-serif text-display-md leading-none text-ink" />
          <span className="text-sm text-muted">
            {price.suffix ? `${price.suffix} · ` : ""}
            {tier.cadence}
          </span>
        </p>
      </div>
      <p className="mt-4 text-[0.9375rem] leading-relaxed text-pretty text-muted">{tier.description}</p>

      <div>
        <ul className="mt-5 grid gap-2 border-t border-line pt-5">{shown.map(feature)}</ul>
      {more.length ? (
        <details className="group/inc mt-3">
          <summary className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-sm font-medium text-ink-2 hover:text-ink">
            Everything included <span className="text-muted tabular-nums">(+{more.length})</span>
            <span aria-hidden className="text-muted transition-transform duration-200 group-open/inc:rotate-90">
              ›
            </span>
          </summary>
          <ul className="mt-3 grid gap-2">{more.map(feature)}</ul>
        </details>
      ) : null}
      </div>

      <div className="mt-auto pt-7 md:mt-0 md:self-end">
        <Button href={tier.cta.href} variant="link" icon="arrow-right">
          {tier.cta.label}
          <span className="sr-only">: {tier.name}</span>
        </Button>
      </div>
    </article>
  );
}
