"use client";

import { useActionState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  saveConnectionConfigAction,
  disconnectAction,
  testConnectionAction,
} from "@/lib/actions/toconline";
import type { TocConnectionStatus } from "@/lib/toconline/connection";

export function ToconlineForm({ status }: { status: TocConnectionStatus }) {
  const [error, saveAction, saving] = useActionState(
    saveConnectionConfigAction,
    undefined,
  );
  const [testResult, testAction, testing] = useActionState(
    () => testConnectionAction(),
    undefined,
  );

  return (
    <div className="flex max-w-xl flex-col gap-8">
      {/* Status strip */}
      <div className="rounded-xl border border-border p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground">Estado da ligação</span>
          <StatusPill status={status} />
        </div>
        {status.connected && (
          <p className="mt-2 text-muted-foreground">
            Ambiente: <span className="text-foreground">{status.environment}</span>
            {status.expiresAt && (
              <>
                {" · "}token válido até{" "}
                {new Date(status.expiresAt).toLocaleString("pt-PT")}
              </>
            )}
          </p>
        )}
      </div>

      {/* Config form */}
      <form action={saveAction} className="flex flex-col gap-5">
        <Field
          id="apiBaseUrl"
          label="URL base da API"
          placeholder="https://api10.toconline.pt"
          defaultValue={status.apiBaseUrl ?? ""}
          required
        />
        <Field
          id="oauthBaseUrl"
          label="URL base OAuth"
          placeholder="https://app10.toconline.pt/oauth"
          defaultValue={status.oauthBaseUrl ?? ""}
          required
        />
        <Field
          id="clientId"
          label="client_id"
          defaultValue={status.clientId ?? ""}
          required
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor="clientSecret">client_secret</Label>
          <Input
            id="clientSecret"
            name="clientSecret"
            type="password"
            autoComplete="off"
            placeholder={
              status.hasClientSecret ? "•••••••• (guardado)" : "Colar segredo"
            }
          />
          <p className="text-xs text-muted-foreground">
            {status.hasClientSecret
              ? "Deixe em branco para manter o segredo atual."
              : "Só é mostrado no TOConline no momento da criação da app."}
          </p>
        </div>
        <Field
          id="redirectUri"
          label="redirect_uri (registar no TOConline)"
          placeholder="https://app.teeway.pt/api/toconline/callback"
          defaultValue={status.redirectUri ?? ""}
          required
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor="environment">Ambiente</Label>
          <select
            id="environment"
            name="environment"
            defaultValue={status.environment}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="PRODUCTION">Produção (conta fiscal real)</option>
            <option value="SANDBOX">Teste</option>
          </select>
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" disabled={saving} className="w-fit">
          {saving ? "A guardar…" : "Guardar configuração"}
        </Button>
      </form>

      {/* Connection actions */}
      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <div className="flex flex-wrap items-center gap-2">
          {/* GET navigation to the OAuth connect route (anchor styled as a
              button — this Base UI Button has no asChild). Disabled-looking
              until the config is saved, since connect needs it. */}
          <a
            href="/api/toconline/connect"
            aria-disabled={!status.configured}
            className={buttonVariants({
              variant: status.connected ? "outline" : "default",
              className: status.configured
                ? undefined
                : "pointer-events-none opacity-50",
            })}
          >
            {status.connected ? "Voltar a ligar" : "Ligar ao TOConline"}
          </a>

          <form action={testAction}>
            <Button type="submit" variant="outline" disabled={testing}>
              {testing ? "A testar…" : "Testar ligação"}
            </Button>
          </form>

          {status.connected && (
            <form action={disconnectAction}>
              <Button type="submit" variant="ghost">
                Desligar
              </Button>
            </form>
          )}
        </div>

        {testResult && (
          <p className="text-sm text-muted-foreground" role="status">
            {testResult}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  defaultValue,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete="off"
        required={required}
      />
    </div>
  );
}

function StatusPill({ status }: { status: TocConnectionStatus }) {
  const [text, cls] = !status.configured
    ? ["Por configurar", "border-border text-muted-foreground"]
    : status.connected
      ? ["Ligado", "border-foreground/30 text-foreground"]
      : ["Configurado, não ligado", "border-border text-muted-foreground"];
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {text}
    </span>
  );
}
