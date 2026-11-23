import { botFaq, botPage, botRobotsRule, botSections, botSimulatedTokens, botSimulatedUserAgent, botUserAgent } from "@/content/bot";
import { JsonLd, faqLd, innerPageLd, lastUpdated, pageMetadata, siteUrl } from "@/lib/seo";
import { CopyButton } from "@/components/audit/CopyButton";
import { CodeBlock, DocBody } from "@/components/pages/DocBody";
import { PageHero } from "@/components/pages/PageHero";

export const metadata = pageMetadata.bot;

export default function BotPage() {
  const u = lastUpdated();
  const origin = siteUrl();
  const faq = faqLd(botFaq);
  const hasFaqLd = Array.isArray(faq.mainEntity) && faq.mainEntity.length > 0;

  const userAgents = (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div>
        <h3 className="text-[0.9375rem] font-semibold text-ink">Normal requests</h3>
        <CodeBlock label="noticrbot user agent" className="mt-2.5">
          {botUserAgent(origin)}
        </CodeBlock>
      </div>
      <div>
        <h3 className="text-[0.9375rem] font-semibold text-ink">Simulated AI-crawler requests</h3>
        <ul className="mt-2.5 grid grid-cols-[minmax(0,1fr)] gap-2">
          {botSimulatedTokens.map((t) => (
            <li key={t}>
              <CodeBlock label={`Simulated ${t.split("/")[0]} user agent`}>{botSimulatedUserAgent(t, origin)}</CodeBlock>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const block = (
    <div className="rounded-card bg-white p-4 shadow-[inset_0_0_0_1px_var(--color-line)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[0.9375rem] font-semibold text-ink">
          robots.txt rule
        </h3>
        <CopyButton text={botRobotsRule} label="robots.txt rule" />
      </div>
      <CodeBlock label="robots.txt rule that blocks noticrbot" className="mt-3">
        {botRobotsRule}
      </CodeBlock>
    </div>
  );

  return (
    <>
      <JsonLd
        data={[
          ...innerPageLd({ name: "About noticrbot", description: botPage.metaDescription, path: "/bot" }),
          ...(hasFaqLd ? [faq] : []),
        ]}
      />
      <PageHero kicker={botPage.kicker} title={botPage.title} intro={botPage.intro} seed={61} compact updated={u} />
      <DocBody
        label={botPage.title}
        sections={botSections}
        extras={{ "user-agents": userAgents, block }}
        faq={{ id: "faq", title: "Common questions", items: botFaq }}
      />
    </>
  );
}
