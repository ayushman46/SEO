import type { PricingTier } from "@/content/types";
import { Button } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { Icon } from "@/components/ui/Icon";
import { PlaceholderText } from "@/components/ui/PlaceholderText";
import { PriceText } from "./PriceText";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Pricing tier card. The highlighted tier is set apart by an ink surface, a
 * blue top rule and a text label (never by colour alone), and is described by
 * that label for screen readers.
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
  return (
    <article
      aria-labelledby={`${id}-name`}
      aria-describedby={hi ? `${id}-label` : undefined}
      className={cx(
        "relative flex h-full flex-col rounded-panel p-6 sm:p-7",
        hi
          ? "bg-ink text-white shadow-float ring-1 ring-ink"
          : "bg-white text-ink shadow-[inset_0_0_0_1px_var(--color-line)]",
      )}
    >
      {hi ? <span aria-hidden className="absolute inset-x-7 top-0 h-1 rounded-b-full bg-accent" /> : null}
      <div className="flex min-h-7 flex-wrap items-center justify-between gap-2">
        <h3 id={`${id}-name`} className="text-lg font-semibold tracking-[-0.01em]">
          {tier.name}
        </h3>
        {hi ? (
          <span
            id={`${id}-label`}
            className="inline-flex items-center gap-1.5 rounded-pill bg-white/10 px-2.5 py-1 text-xs leading-none font-medium text-white ring-1 ring-white/25"
          >
            <Icon name="eye" size={14} />
            {highlightLabel}
          </span>
        ) : null}
      </div>

      <p className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <PriceText
          value={tier.price}
          tone={hi ? "night" : "light"}
          className="font-serif text-[2.75rem] leading-none tracking-[-0.02em]"
        />
        <span className={cx("text-sm", hi ? "text-night-muted" : "text-muted")}>{tier.cadence}</span>
      </p>
      <p className={cx("mt-5 text-[0.9375rem] leading-relaxed text-pretty", hi ? "text-night-muted" : "text-muted")}>
        {tier.description}
      </p>

      <ul className={cx("mt-6 grid gap-3 border-t pt-6", hi ? "border-white/15" : "border-line")}>
        {tier.features.map((f) => (
          <li key={f} className={cx("flex gap-3 text-[0.9375rem] leading-relaxed text-pretty", hi ? "text-night-ink" : "text-ink-2")}>
            <span
              className={cx(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                hi ? "bg-white text-ink" : "bg-accent-600 text-white",
              )}
            >
              <Icon name="check" size={13} strokeWidth={2.4} />
            </span>
            <PlaceholderText value={f} tone={hi ? "night" : "light"} />
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        <Button
          href={tier.cta.href}
          variant={hi ? "primary" : "secondary"}
          icon="arrow-right"
          className="w-full"
        >
          {tier.cta.label}
        </Button>
      </div>
    </article>
  );
}
