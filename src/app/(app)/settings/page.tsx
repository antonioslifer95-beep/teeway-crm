import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { PageHeader } from "@/components/page-header";

const sections = [
  {
    href: "/settings/users",
    title: "Utilizadores",
    description: "Gerir contas de staff e permissões de acesso.",
  },
  {
    href: "/settings/pricing",
    title: "Preços",
    description: "Margem, IVA, direitos aduaneiros e taxa de desalfandegamento por defeito.",
  },
];

export default async function SettingsPage() {
  await requireAdmin();

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Definições da plataforma — apenas administradores."
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-xl border border-border p-5 transition-colors hover:border-foreground/20 hover:bg-muted"
          >
            <div className="text-sm font-semibold text-foreground">
              {section.title}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
