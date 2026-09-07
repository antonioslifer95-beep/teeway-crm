"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MenuIcon, XIcon } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/nav-link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/clients", label: "Clientes" },
  { href: "/cart-models", label: "Modelos" },
  { href: "/orders", label: "Encomendas" },
  { href: "/quotes", label: "Orçamentos" },
  { href: "/invoices", label: "Faturas" },
];

/**
 * Top bar for the authenticated app. On desktop the nav sits inline; below
 * `md` it collapses behind a hamburger that opens a right-side slide-in drawer
 * over a dimming backdrop, so the row can't overflow a phone viewport. The bar
 * and drawer are dark surfaces in both themes, so all colors key to white
 * regardless of theme (same convention as {@link NavLink}).
 */
export function AppHeader({
  userName,
  userRole,
  isAdmin,
}: {
  userName?: string | null;
  userRole?: string | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const items = isAdmin
    ? [...NAV, { href: "/settings", label: "Configurações" }]
    : NAV;

  // Close the drawer on route change (client nav keeps this mounted).
  useEffect(() => setOpen(false), [pathname]);

  // While the drawer is open: Escape closes it and the body can't scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#16181c] text-white dark:bg-[#1f2228] dark:border-b dark:border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-9">
            <Logo className="py-3.5 text-white" />
            <nav className="hidden items-center gap-6 py-4 md:flex">
              {items.map((item) => (
                <NavLink key={item.href} href={item.href}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/account"
              className="hidden items-center text-xs text-white/55 transition-colors hover:text-white sm:inline-flex"
            >
              {userName}
              <span className="ml-1.5 rounded-full border border-white/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/70">
                {userRole}
              </span>
            </Link>
            <ThemeToggle className="text-white/70 hover:bg-white/10 hover:text-white" />
            <form action={logoutAction} className="hidden md:block">
              <Button
                variant="outline"
                size="sm"
                type="submit"
                className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Sair
              </Button>
            </form>

            {/* Hamburger — mobile only */}
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={open}
              className="text-white/80 hover:bg-white/10 hover:text-white md:hidden"
            >
              <MenuIcon />
            </Button>
          </div>
        </div>
      </header>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Slide-in drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-dvh w-72 max-w-[82%] flex-col bg-[#16181c] text-white shadow-2xl transition-transform duration-300 ease-out dark:bg-[#1f2228] md:hidden",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <Logo className="text-white" />
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="text-white/80 hover:bg-white/10 hover:text-white"
          >
            <XIcon />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-3 text-sm transition-colors",
                isActive(item.href)
                  ? "bg-white/10 text-white"
                  : "text-white/65 hover:bg-white/5 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-white"
          >
            {userName}
            <span className="rounded-full border border-white/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/70">
              {userRole}
            </span>
          </Link>
          <form action={logoutAction} className="mt-3">
            <Button
              variant="outline"
              size="sm"
              type="submit"
              className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              Sair
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
