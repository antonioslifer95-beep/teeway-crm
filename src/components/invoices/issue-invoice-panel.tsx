"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { InvoiceStatus } from "@/generated/prisma/client";
import {
  syncInvoiceClientAction,
  issueInvoiceAction,
  refreshInvoiceFiscalDataAction,
} from "@/lib/actions/toconline";
import { formatDatePT } from "@/lib/format";

type Fiscal = {
  officialNumber: string | null;
  atcud: string | null;
  qrCodeData: string | null;
  pdfUrl: string | null;
  issuedAt: Date | null;
  lastSyncError: string | null;
};

export function IssueInvoicePanel({
  invoiceId,
  status,
  fiscal,
}: {
  invoiceId: string;
  status: InvoiceStatus;
  fiscal: Fiscal;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState<{ tone: Tone; text: string } | null>(null);

  // Already issued — show the fiscal record, read-only.
  if (status === "ISSUED") {
    return (
      <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-sm">
        <div className="font-semibold text-foreground">
          Emitida no TOConline
          {fiscal.issuedAt && (
            <span className="ml-2 font-normal text-muted-foreground">
              {formatDatePT(fiscal.issuedAt)}
            </span>
          )}
        </div>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-muted-foreground">
          <Field label="Número oficial" value={fiscal.officialNumber} />
          <Field label="ATCUD" value={fiscal.atcud} />
          <Field label="QR" value={fiscal.qrCodeData} truncate />
        </dl>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {fiscal.pdfUrl && (
            <a
              href={fiscal.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline"
            >
              Abrir documento fiscal (PDF) no TOConline
            </a>
          )}
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={pending}
            onClick={() => {
              setMsg(null);
              startTransition(async () => {
                const r = await refreshInvoiceFiscalDataAction(invoiceId);
                setMsg(
                  r.error
                    ? { tone: "error", text: r.error }
                    : { tone: "ok", text: r.ok! },
                );
                if (!r.error) router.refresh();
              });
            }}
          >
            {pending ? "A atualizar…" : "Atualizar dados fiscais"}
          </Button>
        </div>
        {msg && (
          <p
            className={
              msg.tone === "error"
                ? "mt-3 text-destructive"
                : "mt-3 text-muted-foreground"
            }
            role={msg.tone === "error" ? "alert" : "status"}
          >
            {msg.text}
          </p>
        )}
      </div>
    );
  }

  const canIssue = status === "READY_TO_ISSUE" || status === "ERROR";

  function runSync() {
    setMsg(null);
    startTransition(async () => {
      const r = await syncInvoiceClientAction(invoiceId);
      setMsg(r.error ? { tone: "error", text: r.error } : { tone: "ok", text: r.ok! });
    });
  }

  function runIssue() {
    setMsg(null);
    startTransition(async () => {
      const r = await issueInvoiceAction(invoiceId);
      if (r.error) {
        setMsg({ tone: "error", text: r.error });
      } else {
        setConfirming(false);
        router.refresh(); // reflect the new ISSUED state
      }
    });
  }

  return (
    <div className="mt-6 rounded-xl border border-border p-4 text-sm">
      <div className="font-semibold text-foreground">Emissão fiscal (TOConline)</div>

      {status === "PENDING_REVIEW" && (
        <p className="mt-2 text-muted-foreground">
          Reveja a fatura e mude o estado para{" "}
          <span className="text-foreground">Pronta a emitir</span> para poder
          emitir no TOConline.
        </p>
      )}

      {status === "ERROR" && fiscal.lastSyncError && (
        <p className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-destructive">
          Última tentativa falhou: {fiscal.lastSyncError}
        </p>
      )}

      {canIssue && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={pending}
              onClick={runSync}
            >
              Sincronizar cliente no TOConline
            </Button>
            {!confirming && (
              <Button
                variant="default"
                size="sm"
                type="button"
                disabled={pending}
                onClick={() => {
                  setMsg(null);
                  setConfirming(true);
                }}
              >
                Emitir fatura…
              </Button>
            )}
          </div>

          {confirming && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <p className="font-medium text-foreground">
                Emitir uma fatura fiscal <strong>definitiva</strong> no TOConline?
              </p>
              <p className="mt-1 text-muted-foreground">
                O documento é finalizado no momento do envio e{" "}
                <strong>não pode ser anulado</strong> pela API. Confirme que os
                valores e o cliente estão corretos.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  type="button"
                  disabled={pending}
                  onClick={runIssue}
                >
                  {pending ? "A emitir…" : "Sim, emitir definitivamente"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  disabled={pending}
                  onClick={() => setConfirming(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {msg && (
        <p
          className={
            msg.tone === "error"
              ? "mt-3 text-destructive"
              : "mt-3 text-muted-foreground"
          }
          role={msg.tone === "error" ? "alert" : "status"}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}

type Tone = "ok" | "error";

function Field({
  label,
  value,
  truncate,
}: {
  label: string;
  value: string | null;
  truncate?: boolean;
}) {
  return (
    <>
      <dt className="uppercase tracking-wider text-faint text-xs self-center">
        {label}
      </dt>
      <dd
        className={`text-foreground tabular-nums ${truncate ? "truncate" : ""}`}
      >
        {value ?? "—"}
      </dd>
    </>
  );
}
