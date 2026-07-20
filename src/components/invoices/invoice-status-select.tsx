"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_SELECTABLE_VALUES,
} from "@/lib/invoice-labels";
import { updateInvoiceStatusAction } from "@/lib/actions/invoices";
import type { InvoiceStatus } from "@/generated/prisma/client";

export function InvoiceStatusSelect({
  invoiceId,
  value,
}: {
  invoiceId: string;
  value: InvoiceStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const isLocked = !INVOICE_STATUS_SELECTABLE_VALUES.includes(value);

  if (isLocked) {
    return (
      <span className="text-sm font-medium text-foreground">
        {INVOICE_STATUS_LABELS[value]}
      </span>
    );
  }

  return (
    <Select
      value={value}
      disabled={isPending}
      onValueChange={(next) => {
        startTransition(async () => {
          const result = await updateInvoiceStatusAction(
            invoiceId,
            next as InvoiceStatus,
          );
          if (result?.error) toast.error(result.error);
        });
      }}
    >
      <SelectTrigger className="w-44">
        <SelectValue>
          {(value: InvoiceStatus) => INVOICE_STATUS_LABELS[value]}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {INVOICE_STATUS_SELECTABLE_VALUES.map((status) => (
          <SelectItem key={status} value={status}>
            {INVOICE_STATUS_LABELS[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
