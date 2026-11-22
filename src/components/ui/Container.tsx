import type { ReactNode } from "react";
import { cx } from "./cx";

const widths = {
  narrow: "max-w-3xl",
  default: "max-w-[77.5rem]",
  wide: "max-w-[90rem]",
} as const;

/** Page gutter: 16px at 360, 24px from 640, 32px from 1024. */
export function Container({
  size = "default",
  className,
  children,
}: {
  size?: keyof typeof widths;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cx("mx-auto w-full px-4 sm:px-6 lg:px-8", widths[size], className)}>{children}</div>;
}
