"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createInvoiceFromQuoteAction } from "@/lib/actions/invoices";

export function CreateInvoiceButton({ quoteId }: { quoteId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => startTransition(() => createInvoiceFromQuoteAction(quoteId))}
    >
      {isPending ? "A criar fatura…" : "Criar fatura"}
    </Button>
  );
}
