"use client";

import Link from "next/link";
import {
  Suspense,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { submitContact } from "@/app/actions/contact";
// type-only: keeps zod out of the client bundle
import type {
  ContactField,
  ContactFormState,
} from "@/app/actions/contact-schema";
import {
  contactForm,
  contactQuoteCopy,
  contactServiceOptions,
} from "@/content/contact";
import {
  QUOTE_CHANGE_EVENT,
  clearStoredQuote,
  parseStoredQuote,
  readStoredQuoteRaw,
  type StoredQuote,
} from "@/components/audit/quote/handoff";
import { Button, buttonClass } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { Field, describedBy } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { PlaceholderText } from "@/components/ui/PlaceholderText";
import { QuoteAttachment } from "./QuoteAttachment";

const F = contactForm.fields;
const ORDER: ContactField[] = [
  "name",
  "email",
  "company",
  "website",
  "service",
  "message",
  "consent",
];
const SERVICE_VALUES = new Set(contactServiceOptions.map((o) => o.value));

const control = cx(
  "w-full min-w-0 rounded-control bg-white text-[0.9375rem] text-ink placeholder:text-faint",
  "shadow-[inset_0_0_0_1px_var(--color-line-strong)] transition-shadow duration-200",
  "hover:shadow-[inset_0_0_0_1px_var(--color-ink)]",
  "focus-visible:rounded-control focus-visible:shadow-[inset_0_0_0_2px_var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/40",
  "aria-invalid:shadow-[inset_0_0_0_2px_var(--color-critical)]",
);

const id = (field: string) => `contact-${field}`;

type SelectProps = {
  field: "service";
  options: { value: string; label: string }[];
  defaultValue: string;
  error?: string;
  required?: boolean;
};

function SelectField({ field, options, defaultValue, error, required }: SelectProps) {
  const copy = F[field];
  const help = copy.help || undefined;
  return (
    <Field
      id={id(field)}
      label={
        <>
          {copy.label}
          {required ? <RequiredMark /> : null}
        </>
      }
      help={help}
      error={error}
      // alone on its row since the budget field went (R5 edit 9)
      className="sm:col-span-2"
    >
      <div className="relative">
        <select
          // remount when the default changes so the restored value is applied (select ignores defaultValue updates)
          key={defaultValue}
          id={id(field)}
          name={field}
          defaultValue={defaultValue}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id(field), { help, error })}
          className={cx(control, "h-11 cursor-pointer appearance-none pr-11 pl-4")}
        >
          <option value="">{copy.placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </div>
    </Field>
  );
}

/** Reads ?service= (client-side, inside Suspense, so the page stays static under Cache Components). */
function ServiceFromUrl(
  props: Omit<SelectProps, "field" | "options" | "defaultValue"> & {
    restored?: string;
    fromQuote?: string;
  },
) {
  const params = useSearchParams();
  const q = params.get("service") ?? "";
  const fromQuote = props.fromQuote && SERVICE_VALUES.has(props.fromQuote) ? props.fromQuote : "";
  const preset = props.restored ?? (fromQuote || (SERVICE_VALUES.has(q) ? q : ""));
  return (
    <SelectField
      field="service"
      options={contactServiceOptions}
      defaultValue={preset}
      error={props.error}
      required
    />
  );
}

function RequiredMark() {
  return (
    <>
      <span aria-hidden className="ml-1 text-critical">
        *
      </span>
      <span className="sr-only"> (required)</span>
    </>
  );
}

function subscribeQuote(onChange: () => void) {
  window.addEventListener(QUOTE_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(QUOTE_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The quote carried over from the audit report (sessionStorage), or null. Null on the server. */
function useStoredQuote(): StoredQuote | null {
  const raw = useSyncExternalStore(subscribeQuote, readStoredQuoteRaw, () => null);
  return useMemo(() => parseStoredQuote(raw), [raw]);
}

/** "What happens next" after a successful send. */
function NextSteps({
  steps,
}: {
  steps: { title: string; steps: readonly { title: string; body: string }[] };
}) {
  return (
    <div className="mt-8 border-t border-line pt-7">
      <h3 className="text-[0.9375rem] font-semibold text-ink">{steps.title}</h3>
      <ol className="mt-4 grid gap-5 sm:grid-cols-3">
        {steps.steps.map((st, i) => (
          <li key={st.title} className="min-w-0">
            <span aria-hidden className="font-serif text-lg text-muted tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="mt-1 text-[0.9375rem] font-medium text-ink">{st.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-pretty text-muted">{st.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Wraps the phrase "privacy policy" in the consent label with a link to /privacy. */
function withPrivacyLink(text: string): ReactNode {
  const phrase = "privacy policy";
  const i = text.toLowerCase().indexOf(phrase);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <Link
        href="/privacy"
        className="rounded-sm text-accent-ink underline decoration-accent-ink/40 underline-offset-[3px] hover:decoration-accent-ink"
      >
        {text.slice(i, i + phrase.length)}
      </Link>
      {text.slice(i + phrase.length)}
    </>
  );
}

/**
 * Contact form on `useActionState(submitContact, null)`. Progressive: posts to the
 * server action without JavaScript too. Field errors are inline and wired with
 * aria-invalid / aria-describedby; values are restored after an error; focus moves
 * to the first invalid field (or the error banner), and to the success message on success.
 */
export function ContactForm({ honeypotName }: { honeypotName: string }) {
  const [state, formAction, pending] = useActionState<ContactFormState | null, FormData>(
    submitContact,
    null,
  );
  const bannerRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const stored = useStoredQuote();
  // Remembered at submit time: the stored quote is cleared once the message is sent.
  const [sentWithQuote, setSentWithQuote] = useState(false);
  const [quoteNote, setQuoteNote] = useState("");

  const failed = state && !state.ok ? state : null;
  const errors = failed?.fieldErrors ?? {};
  const values = failed?.values ?? {};
  const err = (f: ContactField) => errors[f]?.[0];
  const hasFieldErrors = ORDER.some((f) => err(f));
  // consent is never echoed back, but if the server did not complain about it, it was ticked
  const consentChecked = Boolean(failed && !errors.consent);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      clearStoredQuote();
      successRef.current?.focus();
      return;
    }
    const first = ORDER.find((f) => state.fieldErrors[f]?.length);
    const el = first ? document.getElementById(id(first)) : null;
    if (el) el.focus();
    else bannerRef.current?.focus();
  }, [state]);

  return (
    <div>
      {/* short status text only: always present so the change is announced; the panel below gets focus */}
      <div role="status" aria-live="polite" className="sr-only">
        {state?.ok ? contactForm.success.title : quoteNote}
      </div>

      {state?.ok ? (
        <div className="rounded-panel bg-white p-6 shadow-paper sm:p-10">
          <Icon name="check" size={28} strokeWidth={2} className="text-pass" />
          <h2
            ref={successRef}
            tabIndex={-1}
            className="mt-7 font-serif text-display-sm text-balance text-ink focus:outline-none"
          >
            {contactForm.success.title}
          </h2>
          <p className="mt-4 max-w-lg text-[1.0625rem] leading-relaxed text-pretty text-muted">
            <PlaceholderText value={contactForm.success.body} />
          </p>
          {/* the generic steps are already beside the form; repeat steps only when they differ (quote sent) */}
          {sentWithQuote ? <NextSteps steps={contactQuoteCopy.nextSteps} /> : null}
          <div className="mt-8">
            <Button href={contactForm.success.cta.href} icon="arrow-right">
              {contactForm.success.cta.label}
            </Button>
          </div>
        </div>
      ) : null}

      {state?.ok ? null : (
        <form
          action={formAction}
          onSubmit={() => setSentWithQuote(stored !== null)}
          noValidate
          aria-labelledby="contact-form-title"
          className="relative rounded-panel bg-white p-5 shadow-paper sm:p-8 lg:p-10"
        >
          <h2 id="contact-form-title" className="sr-only">
            Contact form
          </h2>

          {failed ? (
            <div
              ref={bannerRef}
              role="alert"
              tabIndex={-1}
              className="mb-8 flex items-start gap-3 rounded-control bg-critical-soft px-4 py-3.5 text-[0.9375rem] font-medium text-critical focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
            >
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                className="mt-0.5 size-4 shrink-0"
                fill="currentColor"
              >
                <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm-.75 3.25h1.5v4.5h-1.5v-4.5Zm0 5.75h1.5V12h-1.5v-1.5Z" />
              </svg>
              <p>
                {hasFieldErrors
                  ? contactForm.errors.fieldsInvalid
                  : failed.message || contactForm.errors.generic}
              </p>
            </div>
          ) : null}

          {stored ? (
            <QuoteAttachment
              quote={stored}
              onRemove={() => {
                clearStoredQuote();
                setQuoteNote(contactQuoteCopy.removed);
                document.getElementById(id("message"))?.focus();
              }}
            />
          ) : null}

          <p className="mb-6 text-sm text-muted">
            <span aria-hidden className="text-critical">
              *
            </span>{" "}
            Required
          </p>

          <div className="grid gap-6 sm:grid-cols-2 sm:gap-x-5">
            <Field
              id={id("name")}
              label={
                <>
                  {F.name.label}
                  <RequiredMark />
                </>
              }
              help={F.name.help || undefined}
              error={err("name")}
            >
              <Input
                id={id("name")}
                name="name"
                autoComplete="name"
                required
                maxLength={100}
                placeholder={F.name.placeholder}
                defaultValue={values.name}
                invalid={Boolean(err("name"))}
                aria-describedby={describedBy(id("name"), {
                  help: F.name.help || undefined,
                  error: err("name"),
                })}
              />
            </Field>

            <Field
              id={id("email")}
              label={
                <>
                  {F.email.label}
                  <RequiredMark />
                </>
              }
              help={F.email.help}
              error={err("email")}
            >
              <Input
                id={id("email")}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                required
                maxLength={254}
                placeholder={F.email.placeholder}
                defaultValue={values.email}
                invalid={Boolean(err("email"))}
                aria-describedby={describedBy(id("email"), {
                  help: F.email.help,
                  error: err("email"),
                })}
              />
            </Field>

            <Field
              id={id("company")}
              label={F.company.label}
              help={F.company.help}
              error={err("company")}
            >
              <Input
                id={id("company")}
                name="company"
                autoComplete="organization"
                maxLength={120}
                placeholder={F.company.placeholder}
                defaultValue={values.company}
                invalid={Boolean(err("company"))}
                aria-describedby={describedBy(id("company"), {
                  help: F.company.help,
                  error: err("company"),
                })}
              />
            </Field>

            <Field
              id={id("website")}
              label={F.website.label}
              help={F.website.help}
              error={err("website")}
            >
              <Input
                id={id("website")}
                name="website"
                type="text"
                inputMode="url"
                autoComplete="url"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={2048}
                placeholder={F.website.placeholder}
                defaultValue={values.website}
                invalid={Boolean(err("website"))}
                aria-describedby={describedBy(id("website"), {
                  help: F.website.help,
                  error: err("website"),
                })}
              />
            </Field>

            <Suspense
              fallback={
                <SelectField
                  field="service"
                  options={contactServiceOptions}
                  defaultValue={values.service ?? ""}
                  error={err("service")}
                  required
                />
              }
            >
              <ServiceFromUrl
                // remount once the stored quote is read after hydration, so its service is preselected
                key={stored ? "quote" : "plain"}
                restored={values.service}
                fromQuote={stored?.service}
                error={err("service")}
              />
            </Suspense>

            <Field
              id={id("message")}
              label={
                <>
                  {F.message.label}
                  <RequiredMark />
                </>
              }
              help={F.message.help}
              error={err("message")}
              className="sm:col-span-2"
            >
              <textarea
                // remount once the stored quote is read after hydration, so the prefill applies
                key={stored ? "quote" : "plain"}
                id={id("message")}
                name="message"
                required
                rows={6}
                maxLength={4000}
                placeholder={F.message.placeholder}
                defaultValue={
                  values.message ??
                  (stored ? contactQuoteCopy.message(stored.summary.site) : undefined)
                }
                aria-invalid={err("message") ? true : undefined}
                aria-describedby={describedBy(id("message"), {
                  help: F.message.help,
                  error: err("message"),
                })}
                className={cx(control, "min-h-36 resize-y px-4 py-3 leading-relaxed")}
              />
            </Field>

            {/* consent */}
            <div className="sm:col-span-2">
              <div className="flex items-start gap-3">
                <input
                  // remount after an error so defaultChecked is re-applied
                  key={consentChecked ? "on" : "off"}
                  id={id("consent")}
                  name="consent"
                  type="checkbox"
                  required
                  defaultChecked={consentChecked}
                  aria-invalid={err("consent") ? true : undefined}
                  aria-describedby={err("consent") ? `${id("consent")}-error` : undefined}
                  className="mt-0.5 size-5 shrink-0 cursor-pointer rounded-[5px] accent-accent-600"
                />
                <label
                  htmlFor={id("consent")}
                  className="text-[0.9375rem] leading-relaxed text-pretty text-ink-2"
                >
                  {withPrivacyLink(F.consent.label)}
                  <RequiredMark />
                </label>
              </div>
              {err("consent") ? (
                <p
                  id={`${id("consent")}-error`}
                  className="mt-2 flex items-start gap-2 pl-8 text-sm font-medium text-critical"
                >
                  <svg
                    aria-hidden
                    viewBox="0 0 16 16"
                    className="mt-0.5 size-4 shrink-0"
                    fill="currentColor"
                  >
                    <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm-.75 3.25h1.5v4.5h-1.5v-4.5Zm0 5.75h1.5V12h-1.5v-1.5Z" />
                  </svg>
                  {err("consent")}
                </p>
              ) : null}
            </div>

            {/* honeypot: hidden from people and assistive tech; bots that fill it are silently dropped */}
            <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor={id("hp")}>Do not fill</label>
              <input
                id={id("hp")}
                name={honeypotName}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                defaultValue=""
                // keep password managers / autofill out of the trap
                data-1p-ignore=""
                data-lpignore="true"
                data-bwignore="true"
                data-form-type="other"
              />
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-4 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={pending}
              className={buttonClass({ size: "lg", className: "w-full sm:w-auto" })}
            >
              {pending ? (
                <>
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="size-[18px] motion-safe:animate-spin"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeOpacity="0.3"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M21 12a9 9 0 0 0-9-9"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  {contactForm.submittingLabel}
                </>
              ) : (
                <>
                  {contactForm.submitLabel}
                  <Icon name="arrow-right" size={18} className="shrink-0" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
