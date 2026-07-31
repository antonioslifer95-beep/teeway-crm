"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/lib/actions/users";

export function ChangePasswordForm() {
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Bumping this key remounts the <form>, which clears the password fields on
  // a successful change — nothing sensitive lingers in the inputs.
  const [formKey, setFormKey] = useState(0);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await changePasswordAction(undefined, formData);
      if (result.ok) {
        setError(undefined);
        setSuccess(true);
        setFormKey((k) => k + 1);
      } else {
        setSuccess(false);
        setError(result.error);
      }
    });
  }

  return (
    <form
      key={formKey}
      action={handleSubmit}
      className="flex max-w-sm flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="currentPassword">Palavra-passe atual</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">Nova palavra-passe</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirmar nova palavra-passe</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-foreground" role="status">
          Palavra-passe alterada com sucesso.
        </p>
      )}
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "A guardar…" : "Alterar palavra-passe"}
        </Button>
      </div>
    </form>
  );
}
