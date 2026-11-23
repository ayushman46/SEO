import Image from "next/image";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { enginesDisclaimer, enginesHeading, site } from "@/content/site";
import { home } from "@/content/home";
import { FeatureCollage, FloatingCard } from "@/components/collage/FeatureCollage";
import { SectionTear } from "@/components/collage/SectionTear";
import { TornFrame } from "@/components/collage/TornFrame";
import { AuditUrlForm } from "@/components/home/AuditUrlForm";
import { FeatureList } from "@/components/home/FeatureTabs";
import { Logo, LogoMark } from "@/components/site/Logo";
import { Accordion } from "@/components/ui/Accordion";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EngineStrip } from "@/components/ui/EngineStrip";
import { Field, describedBy } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { IssueRow } from "@/components/ui/IssueRow";
import { PlaceholderText } from "@/components/ui/PlaceholderText";
import { Reveal } from "@/components/ui/Reveal";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Tabs } from "@/components/ui/Tabs";

export const metadata: Metadata = {
  title: "Design preview",
  description: "Internal showcase of the seenhq design system.",
  robots: { index: false, follow: false },
};

const colors: [string, string][] = [
  ["white", "#ffffff"],
  ["paper", "#f7f6f2"],
  ["paper-2", "#efede6"],
  ["ink", "#121212"],
  ["ink-2", "#2b2b29"],
  ["muted", "#5f5e58"],
  ["faint", "#8b8a83"],
  ["line", "#e4e1d8"],
  ["line-strong", "#cfcbc0"],
  ["accent", "#1e7bf5"],
  ["accent-600", "#1a6fe8"],
  ["accent-700", "#155fcc"],
  ["accent-ink", "#1360d6"],
  ["accent-soft", "#e6f0fe"],
  ["night", "#070b19"],
  ["night-2", "#0d1630"],
  ["night-3", "#17234a"],
  ["night-muted", "#b9bccb"],
];

const icons: IconName[] = [
  "search", "sparkles", "gauge", "file", "bot", "link", "list", "shield", "clock", "chart", "eye", "map-pin",
  "arrow-right", "arrow-up-right", "check", "menu", "close", "plus", "lock",
];

const badgeTones: BadgeTone[] = ["neutral", "accent", "outline", "critical", "high", "medium", "low", "pass"];

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-14">
      <h2 className="mb-8 text-kicker font-semibold text-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignPreviewPage() {
  return (
    <Container className="pt-10 pb-24">
      <header className="pb-12">
        <Badge tone="accent">noindex · internal</Badge>
        <h1 className="mt-6 font-serif text-display-lg text-ink">seenhq design system</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Tokens, type and every component with its states. Tokens live in <code>src/app/globals.css</code>; rules in{" "}
          <code>docs/DESIGN_SYSTEM.md</code>.
        </p>
      </header>

      <Block title="Brand">
        <div className="flex flex-wrap items-center gap-10">
          <Logo size="lg" />
          <Logo />
          <LogoMark size={48} />
          <div className="rounded-card bg-night p-5">
            <Logo tone="night" />
          </div>
        </div>
      </Block>

      <Block title="Color tokens">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {colors.map(([name, hex]) => (
            <li key={name} className="overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_var(--color-line)]">
              <div className="h-16" style={{ background: `var(--color-${name})` }} />
              <div className="p-3 text-xs">
                <p className="font-semibold text-ink">{name}</p>
                <p className="font-mono text-muted">{hex}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          {badgeTones.map((t) => (
            <Badge key={t} tone={t} dot>
              {t}
            </Badge>
          ))}
        </div>
      </Block>

      <Block title="Type scale">
        <div className="space-y-6">
          <p className="font-serif text-display-xl">Display XL — be seen</p>
          <p className="font-serif text-display-lg">Display LG — by people and machines</p>
          <p className="font-serif text-display-md">Display MD — section titles</p>
          <p className="font-serif text-display-sm">Display SM — card and panel titles</p>
          <p className="font-serif text-display-md italic">Instrument Serif italic for emphasis</p>
          <p className="text-kicker font-semibold text-muted uppercase">Kicker — 12px, 0.14em tracking</p>
          <p className="max-w-2xl text-lg leading-relaxed text-ink-2">Body large (18px). Inter for UI and body copy, set with generous leading.</p>
          <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-muted">Body (15px), muted ink — 6.3:1 on paper.</p>
        </div>
      </Block>

      <Block title="Section heading">
        <div className="grid gap-12 lg:grid-cols-2">
          <SectionHeading kicker="Kicker" title="A serif section title that balances" body="Optional body copy in muted ink." />
          <div className="rounded-panel bg-night p-8">
            <SectionHeading tone="night" kicker="Night" title="On the night sky" body="Night muted text for bodies." size="sm" />
          </div>
        </div>
      </Block>

      <Block title="Buttons">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button icon="arrow-right">With icon</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link" href="/design-preview" icon="arrow-right">
              Link variant
            </Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-panel bg-night p-6">
            <Button>Primary on night</Button>
            <Button variant="night">Night secondary</Button>
          </div>
        </div>
      </Block>

      <Block title="Icons">
        <ul className="flex flex-wrap gap-3">
          {icons.map((name) => (
            <li key={name} className="flex w-24 flex-col items-center gap-2 rounded-xl bg-paper p-3 text-center text-[0.6875rem] text-muted">
              <Icon name={name} size={22} className="text-ink" />
              {name}
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Inputs and fields">
        <div className="grid gap-8 md:grid-cols-3">
          <Field id="dp-default" label="Default" help="Help text sits under the control.">
            <Input id="dp-default" placeholder="example.com" aria-describedby={describedBy("dp-default", { help: true })} />
          </Field>
          <Field id="dp-error" label="Error" error="That doesn't look like a website address.">
            <Input id="dp-error" defaultValue="not a url" invalid aria-describedby={describedBy("dp-error", { error: true })} />
          </Field>
          <Field id="dp-disabled" label="Disabled">
            <Input id="dp-disabled" disabled placeholder="Disabled" />
          </Field>
        </div>
        <div className="mt-10 max-w-2xl">
          <p className="mb-3 text-sm font-medium text-ink">Audit URL form (validates, then routes to /audit?url=…)</p>
          <AuditUrlForm />
        </div>
        <div className="mt-8 max-w-2xl rounded-panel bg-night p-6">
          <AuditUrlForm tone="night" />
        </div>
      </Block>

      <Block title="Tabs (arrow keys, Home, End)">
        <Tabs
          label="Preview tabs"
          items={home.tabs.map((t) => ({
            id: t.id,
            label: t.label,
            content: (
              <div>
                <h3 className="font-serif text-display-sm">{t.title}</h3>
                <FeatureList items={t.bullets} className="mt-6" />
              </div>
            ),
          }))}
        />
      </Block>

      <Block title="Accordion">
        <Accordion items={home.faq.slice(0, 3).map((f) => ({ title: f.q, content: <p>{f.a}</p> }))} />
      </Block>

      <Block title="Score rings">
        <div className="flex flex-wrap items-center gap-8">
          <ScoreRing value={92} label="Overall" size={140} stroke={10} />
          <ScoreRing value={68} label="SEO" />
          <ScoreRing value={34} label="GEO" size={96} />
          <ScoreRing value={null} label="Performance" size={96} />
          <ScoreRing value={71} label="GEO" size={58} stroke={5} />
          <div className="rounded-card bg-night p-5">
            <ScoreRing value={80} label="Night" tone="night" />
          </div>
        </div>
      </Block>

      <Block title="Issue rows">
        <ul className="max-w-3xl space-y-2">
          <IssueRow as="li" issue={{ severity: "critical", title: "robots.txt blocks GPTBot", category: "geo", effort: "quick", impact: 9 }} />
          <IssueRow as="li" issue={{ severity: "high", title: "Missing meta descriptions", category: "seo", effort: "quick" }} />
          <IssueRow as="li" issue={{ severity: "medium", title: "Hero image is 1.4 MB", category: "performance", effort: "moderate" }} />
          <IssueRow as="li" issue={{ severity: "low", title: "No visible last-updated dates", category: "geo", effort: "involved" }} />
          <IssueRow as="li" locked issue={{ severity: "high", title: "Locked teaser row", category: "seo" }} />
        </ul>
      </Block>

      <Block title="Engine strip">
        <EngineStrip label={enginesHeading} engines={site.enginesTracked} disclaimer={enginesDisclaimer} />
      </Block>

      <Block title="Placeholder copy">
        <p className="text-lg">
          Demo only (no live copy uses it): <PlaceholderText value="[PLACEHOLDER: example marker]" />
        </p>
      </Block>

      <Block title="Collage: torn frames">
        <div className="grid items-center gap-10 md:grid-cols-3">
          <TornFrame seed={3} className="aspect-[4/3]">
            <Image src="/images/sky-cumulus.webp" alt="" fill sizes="(min-width: 768px) 30vw, 90vw" className="object-cover" />
          </TornFrame>
          <TornFrame seed={5} shape="ellipse" shadow="float" className="aspect-[2.15/1]">
            <Image src="/images/eye.webp" alt="" fill sizes="(min-width: 768px) 30vw, 90vw" className="object-cover" />
          </TornFrame>
          <TornFrame seed={44} rotate={4} shadow="float" className="mx-auto aspect-[720/460] w-3/4">
            <Image src="/images/hands.webp" alt="" fill sizes="(min-width: 768px) 22vw, 70vw" className="object-cover" />
          </TornFrame>
        </div>
        <div className="mt-12 max-w-xl">
          <FeatureCollage>
            <FloatingCard title="Floating UI card">
              <p className="text-sm text-muted">Product UI floats over collage art.</p>
            </FloatingCard>
          </FeatureCollage>
        </div>
      </Block>

      <Block title="Section tear + reveal">
        <SectionTear color="var(--color-paper)" grain />
        <div className="paper-grain bg-paper p-10">
          <Reveal>
            <p className="font-serif text-display-sm">Fades up when scrolled into view (no-op with reduced motion).</p>
          </Reveal>
          <Reveal variant="settle" className="mt-8">
            <div className="rounded-card bg-white p-6 shadow-paper">Paper-tear wipe variant.</div>
          </Reveal>
        </div>
        <SectionTear color="var(--color-paper)" flip grain />
      </Block>
    </Container>
  );
}
