import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NewUserDialog } from "@/components/settings/new-user-dialog";
import { ToggleUserActiveButton } from "@/components/settings/toggle-user-active-button";

export default async function UsersSettingsPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <PageHeader
        title="Utilizadores"
        description="Contas de acesso à plataforma."
      >
        <NewUserDialog />
      </PageHeader>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium text-foreground">
                  {user.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.email}
                </TableCell>
                <TableCell>
                  <StatusBadge tone="outline">{user.role}</StatusBadge>
                </TableCell>
                <TableCell>
                  <StatusBadge tone={user.isActive ? "solid" : "muted"}>
                    {user.isActive ? "Ativo" : "Inativo"}
                  </StatusBadge>
                </TableCell>
                <TableCell className="text-right">
                  <ToggleUserActiveButton
                    userId={user.id}
                    isActive={user.isActive}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
