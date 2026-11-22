import type { ReactElement } from "react";
import { home } from "@/content/home";
import type { FeatureItem } from "@/content/types";
import { FeatureCollage, FloatingCard } from "@/components/collage/FeatureCollage";
import { Container } from "@/components/ui/Container";
import { cx } from "@/components/ui/cx";
import { Icon } from "@/components/ui/Icon";
import { IssueRow } from "@/components/ui/IssueRow";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Tabs, type TabItem } from "@/components/ui/Tabs";

export function FeatureList({ items, className }: { items: FeatureItem[]; className?: string }) {
  return (
    <ul className={cx("grid gap-x-8 gap-y-7 sm:grid-cols-2", className)}>
      {items.map((item) => (
        <li key={item.title} className="flex gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-paper text-ink shadow-[inset_0_0_0_1px_var(--color-line)]">
            <Icon name={item.icon} size={20} />
          </span>
          <div className="min-w-0">
            <h4 className="text-[0.9875rem] font-semibold text-ink">{item.title}</h4>
            <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-pretty text-muted">{item.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Illustrative floating cards, one per tab ---------- */

function StatusDot({ status }: { status: "pass" | "warn" | "fail" }) {
  return (
    <span
      className={cx(
        "inline-flex h-5 items-center rounded-pill px-2 text-[0.6875rem] font-semibold",
        status === "pass" && "bg-pass-soft text-pass",
        status === "warn" && "bg-medium-soft text-medium",
        status === "fail" && "bg-critical-soft text-critical",
      )}
    >
      {status === "pass" ? "Pass" : status === "warn" ? "Check" : "Blocked"}
    </span>
  );
}

function SeoCard() {
  const rows: [string, "pass" | "warn" | "fail"][] = [
    ["Title tags", "pass"],
    ["Meta descriptions", "warn"],
    ["One H1 per page", "pass"],
    ["Canonicals & sitemap", "pass"],
  ];
  return (
    <FloatingCard title="SEO checks">
      <div className="flex items-center gap-4">
        <ScoreRing value={84} label="SEO" size={76} stroke={7} />
        <ul className="min-w-0 flex-1 space-y-1.5">
          {rows.map(([label, status]) => (
            <li key={label} className="flex items-center justify-between gap-2 text-[0.8125rem]">
              <span className="truncate text-ink-2">{label}</span>
              <StatusDot status={status} />
            </li>
          ))}
        </ul>
      </div>
    </FloatingCard>
  );
}

function GeoCard() {
  const rows: [string, "pass" | "warn" | "fail"][] = [
    ["GPTBot", "pass"],
    ["ClaudeBot", "pass"],
    ["PerplexityBot", "fail"],
    ["Google-Extended", "pass"],
    ["llms.txt", "warn"],
  ];
  return (
    <FloatingCard title="AI crawler access">
      <ul className="divide-y divide-line">
        {rows.map(([label, status]) => (
          <li key={label} className="flex items-center justify-between gap-2 py-1.5 text-[0.8125rem] first:pt-0 last:pb-0">
            <span className="font-mono text-[0.78rem] text-ink-2">{label}</span>
            <StatusDot status={status} />
          </li>
        ))}
      </ul>
    </FloatingCard>
  );
}

function PerformanceCard() {
  const bars: [string, number, boolean][] = [
    ["FCP", 62, false],
    ["LCP", 88, true],
    ["TBT", 40, false],
    ["CLS", 22, false],
    ["SI", 55, false],
  ];
  return (
    <FloatingCard title="Core Web Vitals, mobile">
      <div className="flex items-end justify-between gap-2.5" style={{ height: 112 }}>
        {bars.map(([label, h, active]) => (
          <div key={label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            {active ? <span className="text-[0.6875rem] font-semibold whitespace-nowrap text-accent-ink tabular-nums">3.9 s</span> : null}
            <span
              className={cx("w-full rounded-t-md rounded-b-sm", active ? "bg-accent" : "bg-paper-2")}
              style={{ height: `${h}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-2.5">
        {bars.map(([label, , active]) => (
          <span key={label} className={cx("flex-1 text-center text-[0.6875rem] font-medium", active ? "text-ink" : "text-muted")}>
            {label}
          </span>
        ))}
      </div>
    </FloatingCard>
  );
}

function FixesCard() {
  return (
    <FloatingCard title="Fix first">
      <ul className="space-y-2">
        <IssueRow as="li" dense issue={{ severity: "critical", title: "Unblock AI crawlers", category: "geo", effort: "quick" }} />
        <IssueRow as="li" dense issue={{ severity: "high", title: "Add meta descriptions", category: "seo", effort: "quick" }} />
        <IssueRow as="li" dense issue={{ severity: "medium", title: "Compress hero image", category: "performance", effort: "moderate" }} />
      </ul>
    </FloatingCard>
  );
}

const cards: Record<string, () => ReactElement> = {
  seo: SeoCard,
  geo: GeoCard,
  performance: PerformanceCard,
  fixes: FixesCard,
};

export function FeatureTabs() {
  const items: TabItem[] = home.tabs.map((tab, i) => {
    const Card = cards[tab.id] ?? SeoCard;
    return {
      id: tab.id,
      label: tab.label,
      content: (
        <div>
          <h3 className="max-w-xl font-serif text-display-sm text-balance text-ink">{tab.title}</h3>
          <p className="mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-pretty text-muted">{tab.body}</p>
          <FeatureList items={tab.bullets} className="mt-9" />
        </div>
      ),
      aside: (
        <FeatureCollage seed={9 + i * 13}>
          <Card />
        </FeatureCollage>
      ),
    };
  });

  return (
    <section aria-labelledby="features-title" className="relative overflow-clip py-24 sm:py-32">
      <Container>
        <h2 id="features-title" className="sr-only">
          What the audit checks
        </h2>
        <Tabs items={items} label="Audit areas" layout="split" />
      </Container>
    </section>
  );
}
