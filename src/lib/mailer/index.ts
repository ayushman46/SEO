import "server-only";
import { getServerEnv, isProduction } from "@/lib/security/env";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface Mailer {
  readonly name: "console" | "resend";
  send(message: MailMessage): Promise<void>;
}

/** Strips CR/LF so user-supplied text can never break out of a header-like field. */
const oneLine = (s: string, max = 200): string => s.replace(/[\r\n]+/g, " ").trim().slice(0, max);

/** Dev / no-config mailer: writes the message to the server log (ADR-010). */
export class ConsoleMailer implements Mailer {
  readonly name = "console" as const;
  async send(message: MailMessage): Promise<void> {
    console.info(
      `[mailer:console] to=${oneLine(message.to)} subject="${oneLine(message.subject)}"\n${message.text}`,
    );
  }
}

/** Resend via plain fetch (no SDK). https://resend.com/docs/api-reference/emails/send-email */
export class ResendMailer implements Mailer {
  readonly name = "resend" as const;
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: MailMessage): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [oneLine(message.to, 254)],
        subject: oneLine(message.subject),
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
      }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!response.ok) {
      // status only: never echo request headers or the API key
      throw new Error(`Resend responded with HTTP ${response.status}`);
    }
  }
}

const DEFAULT_FROM = "seenhq <onboarding@resend.dev>";

export function getMailer(): Mailer {
  const env = getServerEnv();
  if (env.RESEND_API_KEY) return new ResendMailer(env.RESEND_API_KEY, env.MAIL_FROM ?? DEFAULT_FROM);
  return new ConsoleMailer();
}

/**
 * Sends an internal notification to CONTACT_NOTIFY_EMAIL. Best effort: never throws.
 * Without a recipient (or without Resend) it is written to the server log instead.
 * Resolves to true only when the email was actually accepted by Resend.
 */
export async function notifyTeam(subject: string, text: string): Promise<boolean> {
  const to = getServerEnv().CONTACT_NOTIFY_EMAIL;
  const mailer = to ? getMailer() : new ConsoleMailer();
  try {
    await mailer.send({ to: to ?? "(CONTACT_NOTIFY_EMAIL not set)", subject, text });
    return mailer.name === "resend";
  } catch (error) {
    console.error(
      `[mailer] notification failed via ${mailer.name}: ${error instanceof Error ? error.message : "unknown error"}`,
    );
    // fall back to the log so the notification is not lost
    if (mailer.name !== "console") await new ConsoleMailer().send({ to: to ?? "", subject, text });
    return false;
  }
}

/**
 * R7 finding 1: a submission (contact message, order, lead) that was neither stored in the
 * database nor emailed exists only in the short-lived runtime log, while the visitor was told it
 * arrived. In production this writes ONE console.error (shown as an error in Vercel's runtime
 * logs) naming the missing variables. Names only, never values. Silent outside production and
 * whenever at least one sink worked.
 */
export function reportUndeliveredSubmission(
  source: string,
  what: string,
  outcome: { stored: boolean; emailed: boolean },
): void {
  if (outcome.stored || outcome.emailed || !isProduction()) return;
  const env = getServerEnv();
  const missing = (["DATABASE_URL", "RESEND_API_KEY", "CONTACT_NOTIFY_EMAIL"] as const).filter((k) => !env[k]);
  const problems: string[] = [];
  if (missing.length > 0) problems.push(`not set: ${missing.join(", ")}`);
  if (env.DATABASE_URL) problems.push("the database insert failed");
  if (env.RESEND_API_KEY && env.CONTACT_NOTIFY_EMAIL) {
    problems.push(`the email send failed${env.MAIL_FROM ? "" : " (MAIL_FROM not set: the default sender only delivers to the Resend account owner)"}`);
  }
  console.error(
    `[${oneLine(source, 60)}] UNDELIVERED ${oneLine(what, 40)}: not stored and not emailed; it exists only in the log line above. ` +
      `${problems.join("; ")}. Set DATABASE_URL (then npm run db:migrate) and/or RESEND_API_KEY + CONTACT_NOTIFY_EMAIL + MAIL_FROM in Vercel.`,
  );
}
