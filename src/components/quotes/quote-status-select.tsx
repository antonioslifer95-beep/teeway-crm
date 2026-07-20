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
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_VALUES } from "@/lib/quote-labels";
import { updateQuoteStatusAction } from "@/lib/actions/quotes";
import type { QuoteStatus } from "@/generated/prisma/client";

export function QuoteStatusSelect({
  quoteId,
  value,
}: {
  quoteId: string;
  value: QuoteStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={value}
      disabled={isPending}
      onValueChange={(next) => {
        startTransition(async () => {
          const result = await updateQuoteStatusAction(
            quoteId,
            next as QuoteStatus,
          );
          if (result?.error) toast.error(result.error);
        });
      }}
    >
      <SelectTrigger className="w-40">
        <SelectValue>
          {(value: QuoteStatus) => QUOTE_STATUS_LABELS[value]}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {QUOTE_STATUS_VALUES.map((status) => (
          <SelectItem key={status} value={status}>
            {QUOTE_STATUS_LABELS[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
