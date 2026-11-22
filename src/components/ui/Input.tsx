import type { InputHTMLAttributes, Ref } from "react";
import { cx } from "./cx";

export function Input({
  invalid = false,
  inputSize = "md",
  className,
  ref,
  ...rest
}: {
  invalid?: boolean;
  inputSize?: "md" | "lg";
  ref?: Ref<HTMLInputElement>;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cx(
        "w-full min-w-0 rounded-control bg-white text-ink placeholder:text-faint",
        "shadow-[inset_0_0_0_1px_var(--color-line-strong)] transition-shadow duration-200",
        "hover:shadow-[inset_0_0_0_1px_var(--color-ink)]",
        "focus-visible:rounded-control focus-visible:shadow-[inset_0_0_0_2px_var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/40",
        "disabled:cursor-not-allowed disabled:bg-paper disabled:text-faint",
        "aria-invalid:shadow-[inset_0_0_0_2px_var(--color-critical)]",
        inputSize === "lg" ? "h-14 px-5 text-base" : "h-11 px-4 text-[0.9375rem]",
        className,
      )}
      {...rest}
    />
  );
}
