"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { toggleReminderDoneAction } from "@/lib/actions/client-activities";
import { cn } from "@/lib/utils";

export function ReminderToggle({
  activityId,
  clientId,
  done,
}: {
  activityId: string;
  clientId: string;
  done: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await toggleReminderDoneAction(activityId, clientId);
          if (result?.error) toast.error(result.error);
        })
      }
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] transition-colors",
        done
          ? "border-border text-muted-foreground"
          : "border-foreground/30 text-foreground hover:bg-muted",
      )}
    >
      {done ? "Concluído" : "Marcar concluído"}
    </button>
  );
}
