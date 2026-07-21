import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PIPELINE_STAGE_LABELS, PIPELINE_STAGE_VALUES } from "@/lib/pipeline";
import { ReminderToggle } from "@/components/clients/reminder-toggle";
import { QUOTE_STATUS_LABELS } from "@/lib/quote-labels";
import { INVOICE_STATUS_LABELS } from "@/lib/invoice-labels";
import { formatDatePT, formatEUR } from "@/lib/format";

export default async function DashboardPage() {
  const [counts, dueReminders, recentClients, recentQuotes, recentInvoices] =
    await Promise.all([
      prisma.client.groupBy({
        by: ["pipelineStage"],
        _count: { _all: true },
      }),
      prisma.clientActivity.findMany({
        where: { type: "REMINDER", reminderDone: false },
        orderBy: { reminderDueAt: "asc" },
        take: 8,
        include: { client: { select: { id: true, companyName: true } } },
      }),
      prisma.client.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.quote.findMany({
        orderBy: { issueDate: "desc" },
        take: 5,
        include: { client: { select: { companyName: true } } },
      }),
      prisma.invoice.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { client: { select: { companyName: true } } },
      }),
    ]);

  const countByStage = Object.fromEntries(
    counts.map((c) => [c.pipelineStage, c._count._all]),
  );

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {PIPELINE_STAGE_VALUES.map((stage) => (
          <Link
            key={stage}
            href={`/clients?stage=${stage}`}
            className="rounded-lg border border-border p-4 hover:bg-muted"
          >
            <div className="text-2xl font-semibold text-foreground">
              {countByStage[stage] ?? 0}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {PIPELINE_STAGE_LABELS[stage]}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-foreground">Lembretes</h2>
          <ol className="mt-3 flex flex-col gap-2">
            {dueReminders.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Sem lembretes pendentes.
              </p>
            )}
            {dueReminders.map((reminder) => (
              <li
                key={reminder.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <div>
                  <Link
                    href={`/clients/${reminder.client.id}`}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {reminder.client.companyName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {reminder.body}
                  </p>
                  {reminder.reminderDueAt && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDatePT(reminder.reminderDueAt)}
                    </p>
                  )}
                </div>
                <ReminderToggle
                  activityId={reminder.id}
                  clientId={reminder.client.id}
                  done={reminder.reminderDone}
                />
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h2 className="text-sm font-medium text-foreground">
            Clientes recentes
          </h2>
          <ol className="mt-3 flex flex-col gap-2">
            {recentClients.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ainda sem clientes.{" "}
                <Link href="/clients/new" className="underline">
                  Criar o primeiro
                </Link>
                .
              </p>
            )}
            {recentClients.map((client) => (
              <li key={client.id}>
                <Link
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-muted"
                >
                  <span className="text-sm font-medium text-foreground">
                    {client.companyName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {PIPELINE_STAGE_LABELS[client.pipelineStage]}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">
              Orçamentos recentes
            </h2>
            <Link
              href="/quotes"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <ol className="mt-3 flex flex-col gap-2">
            {recentQuotes.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ainda sem orçamentos.
              </p>
            )}
            {recentQuotes.map((quote) => (
              <li key={quote.id}>
                <Link
                  href={`/quotes/${quote.id}`}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-muted"
                >
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {quote.quoteNumber}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {quote.client.companyName} ·{" "}
                      {QUOTE_STATUS_LABELS[quote.status]}
                    </p>
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
            <h2 className="text-sm font-medium text-foreground">
              Faturas recentes
            </h2>
            <Link
              href="/invoices"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <ol className="mt-3 flex flex-col gap-2">
            {recentInvoices.length === 0 && (
              <p className="text-sm text-muted-foreground">Ainda sem faturas.</p>
            )}
            {recentInvoices.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-muted"
                >
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {invoice.internalRef}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {invoice.client.companyName} ·{" "}
                      {INVOICE_STATUS_LABELS[invoice.status]}
                    </p>
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
    </div>
  );
}
