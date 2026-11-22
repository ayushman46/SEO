import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isDbConfigured } from "@/lib/db";
import { listContacts, type ContactRow, type StoredQuote } from "@/lib/db/contact";
import { listLeads, type LeadRow } from "@/lib/db/leads";
import { getAdminMetrics, type AdminMetrics } from "@/lib/db/stats";
import { formatPrice } from "@/lib/quote/catalog";
import { isAuthorizedAdmin } from "@/lib/security/admin-auth";

/*
 * /admin — protected by HTTP Basic auth in src/proxy.ts and re-checked here.
 * With cacheComponents, `export const dynamic` is not allowed; reading headers() inside a
 * <Suspense> boundary makes this content request-time while the shell stays static.
 */
export const metadata: Metadata = {
  title: "Admin · seenhq",
  robots: { index: false, follow: false, nocache: true },
};

const LIMIT = 200;

function formatDate(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : `${d.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Quote cell: catalog total, fixed or not, validity and items. Everything rendered as text. */
function QuoteCell({ quote, auditId, auditUrl }: { quote: StoredQuote | null; auditId: string | null; auditUrl: string | null }) {
  const audit =
    auditId || auditUrl ? (
      <span className="block break-all opacity-70">
        Audit: {auditUrl ?? "-"}
        {auditId ? ` (${auditId.slice(0, 8)})` : ""}
      </span>
    ) : null;
  if (!quote) return audit ?? <>-</>;
  if (quote.malformed || quote.currency === null) {
    return (
      <>
        <span className="block font-semibold">Unreadable quote (dropped)</span>
        {audit}
      </>
    );
  }
  const currency = quote.currency;
  const money = (n: number | null): string => (n === null ? "by email" : formatPrice(n, currency));
  return (
    <>
      <span className="block font-semibold tabular-nums">
        {quote.fixed ? "" : "from "}
        {money(quote.catalogTotal)} {currency}
      </span>
      <span className="block text-xs">
        {quote.fixed ? "Fixed" : "Not fixed: confirm in 1 business day"} ·{" "}
        {quote.valid ? "matches catalog" : `MISMATCH (client said ${money(quote.submittedTotal)})`}
      </span>
      <ul className="mt-1 list-disc pl-4 text-xs">
        {(Array.isArray(quote.items) ? quote.items : []).map((item, i) => (
          <li key={`${item.serviceSlug}-${i}`}>
            {item.label} <code>[{item.serviceSlug}]</code> ({item.submittedFrom ? "from " : ""}
            {money(item.submittedPrice)})
            {item.valid ? null : <strong> invalid: {item.problem ?? "unknown"}</strong>}
            {item.submittedLabel ? <span className="block opacity-70">client label: {item.submittedLabel}</span> : null}
          </li>
        ))}
      </ul>
      {audit}
    </>
  );
}

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 text-foreground">
      <h1 className="text-2xl font-semibold">seenhq admin</h1>
      <Suspense fallback={<p className="mt-6 text-sm opacity-70">Loading…</p>}>
        <AdminContent />
      </Suspense>
    </main>
  );
}

async function AdminContent() {
  const requestHeaders = await headers();
  if (!(await isAuthorizedAdmin(requestHeaders.get("authorization")))) notFound();

  if (!isDbConfigured()) {
    return (
      <p role="status" className="mt-6 rounded border border-current/20 p-4 text-sm">
        <strong>DATABASE_URL not configured.</strong> Audits still run, but leads and contact submissions are only
        written to the server log. Set <code>DATABASE_URL</code> and run <code>npm run db:migrate</code>.
      </p>
    );
  }

  let metrics: AdminMetrics | null;
  let leads: LeadRow[];
  let contacts: ContactRow[];
  try {
    [metrics, leads, contacts] = await Promise.all([getAdminMetrics(), listLeads(LIMIT), listContacts(LIMIT)]);
  } catch (error) {
    console.error(`[admin] database query failed: ${error instanceof Error ? error.message : "unknown error"}`);
    return (
      <p role="alert" className="mt-6 rounded border border-current/20 p-4 text-sm">
        Could not load data from the database. Check the connection and that migrations have been applied.
      </p>
    );
  }

  return (
    <>
      <section aria-labelledby="metrics-heading" className="mt-8">
        <h2 id="metrics-heading" className="sr-only">
          Metrics
        </h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Audits today (UTC)", metrics?.auditsToday],
            ["Audits, 7 days", metrics?.audits7d],
            ["Leads, 7 days", metrics?.leads7d],
            ["Contacts, 7 days", metrics?.contacts7d],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded border border-current/20 p-4">
              <dt className="text-sm opacity-70">{label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{value ?? 0}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="leads-heading" className="mt-10">
        <h2 id="leads-heading" className="text-lg font-semibold">
          Leads <span className="text-sm font-normal opacity-70">(latest {LIMIT})</span>
        </h2>
        {leads.length === 0 ? (
          <p className="mt-3 text-sm opacity-70">No leads yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-current/20">
                  <th scope="col" className="py-2 pr-4">Date</th>
                  <th scope="col" className="py-2 pr-4">Email</th>
                  <th scope="col" className="py-2 pr-4">Site</th>
                  <th scope="col" className="py-2 pr-4">Score</th>
                  <th scope="col" className="py-2 pr-4">Source</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-current/10 align-top">
                    <td className="py-2 pr-4 whitespace-nowrap tabular-nums">{formatDate(lead.createdAt)}</td>
                    <td className="py-2 pr-4">
                      <a className="underline" href={`mailto:${lead.email}`}>
                        {lead.email}
                      </a>
                    </td>
                    <td className="py-2 pr-4 break-all">{lead.url ?? "-"}</td>
                    <td className="py-2 pr-4 tabular-nums">{lead.overallScore ?? "-"}</td>
                    <td className="py-2 pr-4">{lead.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="contacts-heading" className="mt-10">
        <h2 id="contacts-heading" className="text-lg font-semibold">
          Contact submissions <span className="text-sm font-normal opacity-70">(latest {LIMIT})</span>
        </h2>
        {contacts.length === 0 ? (
          <p className="mt-3 text-sm opacity-70">No contact submissions yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-current/20">
                  <th scope="col" className="py-2 pr-4">Date</th>
                  <th scope="col" className="py-2 pr-4">Name</th>
                  <th scope="col" className="py-2 pr-4">Email</th>
                  <th scope="col" className="py-2 pr-4">Company / website</th>
                  <th scope="col" className="py-2 pr-4">Service</th>
                  <th scope="col" className="py-2 pr-4">Budget</th>
                  <th scope="col" className="py-2 pr-4">Quote</th>
                  <th scope="col" className="py-2 pr-4">Status</th>
                  <th scope="col" className="py-2 pr-4">Message</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id} className="border-b border-current/10 align-top">
                    <td className="py-2 pr-4 whitespace-nowrap tabular-nums">{formatDate(c.createdAt)}</td>
                    <td className="py-2 pr-4">{c.name}</td>
                    <td className="py-2 pr-4">
                      <a className="underline" href={`mailto:${c.email}`}>
                        {c.email}
                      </a>
                    </td>
                    <td className="py-2 pr-4 break-all">
                      {c.company ?? "-"}
                      {c.website ? <span className="block opacity-70">{c.website}</span> : null}
                    </td>
                    <td className="py-2 pr-4">{c.service}</td>
                    <td className="py-2 pr-4">{c.budget ?? "-"}</td>
                    <td className="min-w-48 py-2 pr-4">
                      <QuoteCell quote={c.quote} auditId={c.auditId} auditUrl={c.auditUrl} />
                    </td>
                    <td className="py-2 pr-4">{c.status}</td>
                    <td className="py-2 pr-4 whitespace-pre-wrap" title={c.message}>
                      {truncate(c.message, 600)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
