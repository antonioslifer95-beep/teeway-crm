import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { StageSelect } from "@/components/clients/stage-select";
import { AddActivityForm } from "@/components/clients/add-activity-form";
import { ReminderToggle } from "@/components/clients/reminder-toggle";
import { ACTIVITY_TYPE_LABELS } from "@/lib/pipeline";
import { PageHeader, SectionLabel } from "@/components/page-header";
import { InvoiceStatusBadge, QuoteStatusBadge } from "@/components/status-badge";
import { formatDatePT, formatDateTimePT, formatEUR } from "@/lib/format";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      activities: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
      quotes: {
        orderBy: { issueDate: "desc" },
        select: {
          id: true,
          quoteNumber: true,
          status: true,
          issueDate: true,
          totalIncVat: true,
        },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          internalRef: true,
          status: true,
          issueDate: true,
          totalIncVat: true,
        },
      },
    },
  });

  if (!client) notFound();

  const contactLines = [
    client.nif ? `NIF ${client.nif}` : null,
    client.addressLine,
    [client.postalCode, client.city].filter(Boolean).join(" "),
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={client.companyName}
        description={client.contactName || undefined}
      >
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/clients/${client.id}/edit`} />}
        >
          Editar
        </Button>
      </PageHeader>

      <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
        <div>
          <SectionLabel>Fase</SectionLabel>
          <div className="mt-2">
            <StageSelect clientId={client.id} value={client.pipelineStage} />
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {client.email && <div>{client.email}</div>}
          {client.phone && <div>{client.phone}</div>}
        </div>
        {contactLines.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {contactLines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <SectionLabel>Orçamentos</SectionLabel>
            <Link
              href={`/quotes/new?clientId=${client.id}`}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              + Novo
            </Link>
          </div>
          <ol className="mt-3 flex flex-col gap-2">
            {client.quotes.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem orçamentos.</p>
            )}
            {client.quotes.map((quote) => (
              <li key={quote.id}>
                <Link
                  href={`/quotes/${quote.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:border-foreground/20 hover:bg-muted"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {quote.quoteNumber}
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {formatDatePT(quote.issueDate)}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                    <span className="text-sm font-medium text-foreground tabular-nums">
                      {formatEUR(quote.totalIncVat)}
                    </span>
                    <QuoteStatusBadge value={quote.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <SectionLabel>Faturas</SectionLabel>
            <Link
              href={`/invoices/new?clientId=${client.id}`}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              + Nova
            </Link>
          </div>
          <ol className="mt-3 flex flex-col gap-2">
            {client.invoices.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem faturas.</p>
            )}
            {client.invoices.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:border-foreground/20 hover:bg-muted"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {invoice.internalRef}
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {invoice.issueDate ? formatDatePT(invoice.issueDate) : "—"}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                    <span className="text-sm font-medium text-foreground tabular-nums">
                      {formatEUR(invoice.totalIncVat)}
                    </span>
                    <InvoiceStatusBadge value={invoice.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <SectionLabel className="mt-12">Notas e atividade</SectionLabel>
      <div className="mt-3">
        <AddActivityForm clientId={client.id} />
      </div>

      <ol className="mt-6 flex flex-col gap-4">
        {client.activities.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ainda sem atividade registada.
          </p>
        )}
        {client.activities.map((activity) => (
          <li
            key={activity.id}
            className="rounded-lg border border-border p-4"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {ACTIVITY_TYPE_LABELS[activity.type]}
                {activity.author?.name ? ` · ${activity.author.name}` : ""}
              </span>
              <span>{formatDateTimePT(activity.createdAt)}</span>
            </div>
            {activity.body && (
              <p className="mt-2 text-sm text-foreground">{activity.body}</p>
            )}
            {activity.reminderDueAt && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  Lembrete: {formatDatePT(activity.reminderDueAt)}
                </span>
                <ReminderToggle
                  activityId={activity.id}
                  clientId={client.id}
                  done={activity.reminderDone}
                />
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
