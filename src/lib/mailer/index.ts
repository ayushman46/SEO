import "server-only";
import { getServerEnv } from "@/lib/security/env";

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
 */
export async function notifyTeam(subject: string, text: string): Promise<void> {
  const to = getServerEnv().CONTACT_NOTIFY_EMAIL;
  const mailer = to ? getMailer() : new ConsoleMailer();
  try {
    await mailer.send({ to: to ?? "(CONTACT_NOTIFY_EMAIL not set)", subject, text });
  } catch (error) {
    console.error(
      `[mailer] notification failed via ${mailer.name}: ${error instanceof Error ? error.message : "unknown error"}`,
    );
    // fall back to the log so the notification is not lost
    if (mailer.name !== "console") await new ConsoleMailer().send({ to: to ?? "", subject, text });
  }
}
