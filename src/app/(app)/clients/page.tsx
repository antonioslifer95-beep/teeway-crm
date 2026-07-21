import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PipelineBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PIPELINE_STAGE_LABELS, PIPELINE_STAGE_VALUES } from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import type { PipelineStage } from "@/generated/prisma/client";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage } = await searchParams;
  const activeStage =
    stage && PIPELINE_STAGE_VALUES.includes(stage as PipelineStage)
      ? (stage as PipelineStage)
      : undefined;

  const clients = await prisma.client.findMany({
    where: activeStage ? { pipelineStage: activeStage } : undefined,
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Pipeline comercial — do primeiro contacto ao negócio fechado."
      >
        <Button nativeButton={false} render={<Link href="/clients/new" />}>
          Novo cliente
        </Button>
      </PageHeader>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/clients"
          className={cn(
            "rounded-full border border-border px-3 py-1 text-xs",
            !activeStage
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Todos
        </Link>
        {PIPELINE_STAGE_VALUES.map((s) => (
          <Link
            key={s}
            href={`/clients?stage=${s}`}
            className={cn(
              "rounded-full border border-border px-3 py-1 text-xs",
              activeStage === s
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {PIPELINE_STAGE_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Localidade</TableHead>
              <TableHead>Fase</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Sem clientes{activeStage ? " nesta fase" : ""}.
                </TableCell>
              </TableRow>
            )}
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <Link
                    href={`/clients/${client.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {client.companyName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {client.contactName || client.email || client.phone || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {client.city || "—"}
                </TableCell>
                <TableCell>
                  <PipelineBadge value={client.pipelineStage} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
