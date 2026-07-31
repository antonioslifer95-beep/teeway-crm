import { requireAuth } from "@/lib/auth-guard";
import { PageHeader, SectionLabel } from "@/components/page-header";
import { ChangePasswordForm } from "@/components/account/change-password-form";

export default async function AccountPage() {
  const session = await requireAuth();

  return (
    <div>
      <PageHeader
        title="A minha conta"
        description="Os teus dados de acesso."
      />

      <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4 text-sm">
        <div>
          <SectionLabel>Nome</SectionLabel>
          <div className="mt-2 text-foreground">{session.user.name}</div>
        </div>
        <div>
          <SectionLabel>Email</SectionLabel>
          <div className="mt-2 text-foreground">{session.user.email}</div>
        </div>
        <div>
          <SectionLabel>Perfil</SectionLabel>
          <div className="mt-2 text-foreground">{session.user.role}</div>
        </div>
      </div>

      <SectionLabel className="mt-12">Alterar palavra-passe</SectionLabel>
      <div className="mt-4">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
