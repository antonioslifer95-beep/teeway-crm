import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";

export default async function SettingsPage() {
  await requireAdmin();

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
      <div className="mt-6 flex flex-col gap-2">
        <Link
          href="/settings/users"
          className="w-fit rounded-lg border border-border px-4 py-3 text-sm text-foreground hover:bg-muted"
        >
          Utilizadores
        </Link>
        <Link
          href="/settings/pricing"
          className="w-fit rounded-lg border border-border px-4 py-3 text-sm text-foreground hover:bg-muted"
        >
          Preços
        </Link>
      </div>
    </div>
  );
}
