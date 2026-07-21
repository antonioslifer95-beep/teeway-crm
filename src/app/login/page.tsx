"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Monogram, Wordmark } from "@/components/brand/logo";

export default function LoginPage() {
  const [error, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel — the signature dark inverted surface. */}
      <div className="relative hidden flex-col justify-between bg-[#16181c] p-12 text-white lg:flex">
        <Wordmark className="text-white" />
        <div>
          <Monogram size={72} strokeWidth={2.5} className="text-white" />
          <h1 className="mt-8 max-w-sm text-2xl font-semibold leading-snug tracking-tight">
            Gestão de clientes, orçamentos e faturas.
          </h1>
          <p className="mt-3 max-w-sm text-sm text-white/55">
            A plataforma interna da Teeway Mobility para orçamentar carrinhos
            elétricos e emitir documentos com a identidade da marca.
          </p>
        </div>
        <p className="text-[11px] leading-relaxed text-white/45">
          Teeway Mobility é uma marca comercial de Credible Legion Unipessoal
          Lda · NIPC 519 512 561 · Porto
        </p>
      </div>

      {/* Form panel. */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 text-foreground lg:hidden">
            <Monogram size={30} />
            <Wordmark />
          </div>

          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Entrar
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Aceda com as suas credenciais Teeway.
          </p>

          <form action={formAction} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Palavra-passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={isPending} className="mt-2">
              {isPending ? "A entrar…" : "Entrar"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
