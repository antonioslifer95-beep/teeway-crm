import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { StageSelect } from "@/components/clients/stage-select";
import { AddActivityForm } from "@/components/clients/add-activity-form";
import { ReminderToggle } from "@/components/clients/reminder-toggle";
import { ACTIVITY_TYPE_LABELS } from "@/lib/pipeline";
import { QUOTE_STATUS_LABELS } from "@/lib/quote-labels";
import { INVOICE_STATUS_LABELS } from "@/lib/invoice-labels";
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
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {client.companyName}
          </h1>
          {client.contactName && (
            <p className="mt-1 text-sm text-muted-foreground">
              {client.contactName}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/clients/${client.id}/edit`} />}
        >
          Editar
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-6">
        <div>
          <div className="text-xs text-muted-foreground">Fase</div>
          <div className="mt-1.5">
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
            <h2 className="text-sm font-medium text-foreground">Orçamentos</h2>
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
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-muted"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {quote.quoteNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {QUOTE_STATUS_LABELS[quote.status]} ·{" "}
                      {formatDatePT(quote.issueDate)}
                    </div>
                  </div>
                  <span className="text-sm text-foreground">
                    {formatEUR(quote.totalIncVat)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">Faturas</h2>
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
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-muted"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {invoice.internalRef}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {INVOICE_STATUS_LABELS[invoice.status]}
                      {invoice.issueDate
                        ? ` · ${formatDatePT(invoice.issueDate)}`
                        : ""}
                    </div>
                  </div>
                  <span className="text-sm text-foreground">
                    {formatEUR(invoice.totalIncVat)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <h2 className="mt-10 text-sm font-medium text-foreground">
        Notas e atividade
      </h2>
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
