"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { removeQuoteLineAction } from "@/lib/actions/quotes";

export function RemoveQuoteLineButton({
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
          const result = await removeQuoteLineAction(lineId, quoteId);
          if (result?.error) toast.error(result.error);
        })
      }
    >
      Remover
    </Button>
  );
}
