"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { removeInvoiceLineAction } from "@/lib/actions/invoices";

export function RemoveInvoiceLineButton({
  lineId,
  invoiceId,
}: {
  lineId: string;
  invoiceId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await removeInvoiceLineAction(lineId, invoiceId);
          if (result?.error) toast.error(result.error);
        })
      }
    >
      Remover
    </Button>
  );
}
