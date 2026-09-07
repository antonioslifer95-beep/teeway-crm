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
 * `md` it collapses behind a hamburger so the row can't overflow a phone
 * viewport. The bar is a dark surface in both themes, so all colors key to
 * white regardless of theme (same convention as {@link NavLink}).
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

  // Close the mobile menu on route change (client nav keeps this mounted).
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
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
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            className="text-white/80 hover:bg-white/10 hover:text-white md:hidden"
          >
            {open ? <XIcon /> : <MenuIcon />}
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-white/10 md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-6 py-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "border-b border-white/10 py-3.5 text-sm transition-colors",
                  isActive(item.href)
                    ? "text-white"
                    : "text-white/60 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 border-b border-white/10 py-3.5 text-sm text-white/60 hover:text-white"
            >
              {userName}
              <span className="rounded-full border border-white/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/70">
                {userRole}
              </span>
            </Link>
            <form action={logoutAction} className="py-3">
              <Button
                variant="outline"
                size="sm"
                type="submit"
                className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Sair
              </Button>
            </form>
          </nav>
        </div>
      )}
    </header>
  );
}
