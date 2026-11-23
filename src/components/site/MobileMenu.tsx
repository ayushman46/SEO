"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { Cta } from "@/content/types";
import { buttonClass } from "@/components/ui/Button";
import { cx } from "@/components/ui/cx";
import { Icon } from "@/components/ui/Icon";
import { lockSmoothScroll } from "@/components/scroll/smooth";
import { Logo } from "./Logo";

/**
 * Mobile menu sheet on a native modal <dialog>: the browser traps focus, makes
 * the page inert, closes on Esc and returns focus to the trigger. We add
 * backdrop-click close, link-click close and auto-close at the lg breakpoint.
 */
export function MobileMenu({ links, cta, className }: { links: Cta[]; cta: Cta; className?: string }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const unlockRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => {
      unlockRef.current?.();
      unlockRef.current = null;
      setOpen(false);
      triggerRef.current?.focus();
    };
    dialog.addEventListener("close", onClose);
    const mq = window.matchMedia("(min-width: 1024px)");
    const onBreakpoint = () => {
      if (mq.matches && dialog.open) dialog.close();
    };
    mq.addEventListener("change", onBreakpoint);
    return () => {
      dialog.removeEventListener("close", onClose);
      mq.removeEventListener("change", onBreakpoint);
      unlockRef.current?.();
    };
  }, []);

  function show() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    // pause smooth scrolling behind the modal (page scroll is also locked in CSS)
    unlockRef.current = lockSmoothScroll();
    setOpen(true);
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        aria-label="Open menu"
        className={cx(
          "grid size-11 place-items-center rounded-pill bg-white/95 text-ink shadow-pill ring-1 ring-ink/[0.06] transition-colors hover:bg-white",
          className,
        )}
      >
        <Icon name="menu" size={20} />
      </button>

      <dialog
        ref={dialogRef}
        id={id}
        aria-label="Menu"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="menu-sheet fixed inset-x-3 top-3 bottom-auto m-0 w-auto overflow-hidden rounded-panel bg-white p-0 text-ink shadow-float"
      >
        <div className="flex items-center justify-between py-3 pr-3 pl-5">
          <Link href="/" onClick={close} aria-label="seenhq home" className="rounded-md">
            <Logo />
          </Link>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="grid size-10 place-items-center rounded-[0.8rem] bg-paper text-ink transition-colors hover:bg-paper-2"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <nav aria-label="Mobile" className="border-t border-line px-5">
          <ul>
            {links.map((link) => (
              <li key={link.href} className="border-b border-line last:border-b-0">
                <Link
                  href={link.href}
                  onClick={close}
                  className="flex items-center justify-between py-4 font-serif text-[1.875rem] leading-none text-ink transition-colors hover:text-accent-ink"
                >
                  {link.label}
                  <Icon name="arrow-right" size={20} className="text-faint" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="paper-grain bg-paper p-5">
          <Link href={cta.href} onClick={close} className={buttonClass({ size: "lg", className: "w-full" })}>
            {cta.label}
            <Icon name="arrow-right" size={18} />
          </Link>
        </div>
      </dialog>
    </>
  );
}
