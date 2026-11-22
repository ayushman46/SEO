import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";
import { Icon, type IconName } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link" | "night";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,color,box-shadow,transform] duration-200 ease-(--ease-paper) focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary:
    "rounded-pill bg-accent-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_1px_2px_rgb(17_79_173/0.35),0_8px_20px_-10px_rgb(26_111_232/0.8)] hover:bg-accent-700 active:translate-y-px active:bg-accent-800",
  secondary:
    "rounded-pill bg-white text-ink shadow-[inset_0_0_0_1px_var(--color-line-strong)] hover:bg-paper hover:shadow-[inset_0_0_0_1px_var(--color-ink)] active:translate-y-px",
  ghost: "rounded-pill text-ink hover:bg-ink/[0.05] active:bg-ink/[0.08]",
  link: "rounded-sm text-accent-ink underline decoration-accent-ink/30 underline-offset-[5px] hover:decoration-accent-ink",
  night:
    "rounded-pill bg-white/[0.08] text-night-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22)] hover:bg-white/[0.14] active:translate-y-px",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-13 px-6 text-base",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cx(base, variants[variant], variant === "link" ? "text-[0.9375rem]" : sizes[size], className);
}

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  className?: string;
  children: ReactNode;
};

type ButtonAsLink = CommonProps & { href: string; prefetch?: boolean; "aria-label"?: string };
type ButtonAsButton = CommonProps & { href?: undefined } & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "children"
  >;

/** Button, or a link styled as one. Pass `href` to render a Next <Link>. */
export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant = "primary", size = "md", icon, className, children } = props;
  const cls = buttonClass({ variant, size, className });
  const content = (
    <>
      {children}
      {icon ? (
        <Icon
          name={icon}
          size={size === "sm" ? 16 : 18}
          className="shrink-0 transition-transform duration-300 ease-(--ease-paper) group-hover/btn:translate-x-0.5"
        />
      ) : null}
    </>
  );

  if (props.href !== undefined) {
    const { href, prefetch } = props;
    const external = /^https?:\/\//.test(href) || href.startsWith("mailto:");
    if (external) {
      return (
        <a href={href} className={cls} aria-label={props["aria-label"]}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} prefetch={prefetch} className={cls} aria-label={props["aria-label"]}>
        {content}
      </Link>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { variant: _v, size: _s, icon: _i, className: _c, children: _ch, href: _h, type = "button", ...rest } = props;
  return (
    <button type={type} className={cls} {...rest}>
      {content}
    </button>
  );
}
