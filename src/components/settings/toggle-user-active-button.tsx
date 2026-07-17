"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleUserActiveAction } from "@/lib/actions/users";

export function ToggleUserActiveButton({
  userId,
  isActive,
}: {
  userId: string;
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
          const result = await toggleUserActiveAction(userId);
          if (result?.error) toast.error(result.error);
        })
      }
    >
      {isActive ? "Desativar" : "Ativar"}
    </Button>
  );
}
