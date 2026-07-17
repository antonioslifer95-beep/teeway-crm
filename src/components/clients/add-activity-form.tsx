"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addActivityAction } from "@/lib/actions/client-activities";

export function AddActivityForm({ clientId }: { clientId: string }) {
  const boundAction = addActivityAction.bind(null, clientId);
  const [error, formAction, isPending] = useActionState(
    boundAction,
    undefined,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-border p-4"
    >
      <Textarea
        name="body"
        placeholder="Escrever uma nota…"
        required
        className="min-h-20"
      />
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reminderDueAt" className="text-xs text-muted-foreground">
            Lembrete para (opcional)
          </Label>
          <Input
            id="reminderDueAt"
            name="reminderDueAt"
            type="date"
            className="w-44"
          />
        </div>
        <Button type="submit" disabled={isPending} className="ml-auto">
          {isPending ? "A guardar…" : "Adicionar"}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
