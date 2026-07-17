"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleCartModelActiveAction } from "@/lib/actions/cart-models";

export function ToggleCartModelActiveButton({
  cartModelId,
  isActive,
}: {
  cartModelId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await toggleCartModelActiveAction(cartModelId);
          if (result?.error) toast.error(result.error);
        })
      }
    >
      {isActive ? "Desativar" : "Ativar"}
    </Button>
  );
}
