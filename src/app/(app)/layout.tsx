import Link from "next/link";
import { auth } from "@/auth";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/nav-link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-background">
      {/* Signature dark inverted band — echoes the document headers, stays
          dark in both light and dark themes (elevated slightly in dark). */}
      <header className="sticky top-0 z-40 bg-[#16181c] text-white dark:bg-[#1f2228] dark:border-b dark:border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-9">
            <Logo className="py-3.5 text-white" />
            <nav className="flex items-center gap-6 py-4">
              <NavLink href="/">Dashboard</NavLink>
              <NavLink href="/clients">Clientes</NavLink>
              <NavLink href="/cart-models">Modelos</NavLink>
              <NavLink href="/orders">Encomendas</NavLink>
              <NavLink href="/quotes">Orçamentos</NavLink>
              <NavLink href="/invoices">Faturas</NavLink>
              {isAdmin && <NavLink href="/settings">Configurações</NavLink>}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/account"
              className="hidden items-center text-xs text-white/55 transition-colors hover:text-white sm:inline-flex"
            >
              {session?.user?.name}
              <span className="ml-1.5 rounded-full border border-white/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/70">
                {session?.user?.role}
              </span>
            </Link>
            <ThemeToggle className="text-white/70 hover:bg-white/10 hover:text-white" />
            <form action={logoutAction}>
              <Button
                variant="outline"
                size="sm"
                type="submit"
                className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
