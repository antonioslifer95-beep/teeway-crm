"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Requests the server-rendered (vector) PDF and saves it. Server generation
 * takes a few seconds, so we show a pending state and surface failures instead
 * of leaving the user staring at an unresponsive button.
 */
export function DownloadPdfButton({ href }: { href: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const filename =
        res.headers
          .get("Content-Disposition")
          ?.match(/filename="([^"]+)"/)?.[1] ?? "fatura.pdf";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao gerar o PDF.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button type="button" onClick={handleClick} disabled={pending}>
        {pending ? "A gerar PDF…" : "Exportar PDF"}
      </Button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}
