"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { recalculateQuoteLineAction } from "@/lib/actions/quotes";

export function RecalculateQuoteLineButton({
  lineId,
  quoteId,
}: {
  lineId: string;
  quoteId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await recalculateQuoteLineAction(lineId, quoteId);
          if (result?.error) toast.error(result.error);
          else toast.success("Linha recalculada.");
        })
      }
    >
      Recalcular
    </Button>
  );
}
