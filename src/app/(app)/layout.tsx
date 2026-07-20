import { auth } from "@/auth";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/nav-link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-8">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-foreground">
              teeway
            </span>
            <span className="text-[9px] tracking-[0.3em] text-muted-foreground">
              MOBILITY
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/clients">Clientes</NavLink>
            <NavLink href="/cart-models">Modelos</NavLink>
            <NavLink href="/orders">Encomendas</NavLink>
            <NavLink href="/quotes">Orçamentos</NavLink>
            <NavLink href="/invoices">Faturas</NavLink>
            {isAdmin && <NavLink href="/settings">Configurações</NavLink>}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {session?.user?.name} · {session?.user?.role}
          </span>
          <form action={logoutAction}>
            <Button variant="outline" size="sm" type="submit">
              Sair
            </Button>
          </form>
        </div>
      </header>

      <div className="p-6">{children}</div>
    </div>
  );
}
