"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { removeOrderItemAction } from "@/lib/actions/orders";

export function RemoveOrderItemButton({
  itemId,
  orderId,
}: {
  itemId: string;
  orderId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await removeOrderItemAction(itemId, orderId);
          if (result?.error) toast.error(result.error);
        })
      }
    >
      Remover
    </Button>
  );
}
