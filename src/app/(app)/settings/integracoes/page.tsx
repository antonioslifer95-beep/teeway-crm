import { requireAdmin } from "@/lib/auth-guard";
import { getConnection, toStatus } from "@/lib/toconline/connection";
import { ToconlineForm } from "@/components/settings/toconline-form";

const CALLBACK_MESSAGES: Record<string, { ok?: boolean; text: string }> = {
  "1": { ok: true, text: "Ligado ao TOConline com sucesso." },
  not_configured: { text: "Preencha e guarde a configuração antes de ligar." },
  missing_code: { text: "O TOConline não devolveu um código de autorização." },
  bad_state: { text: "Falha de validação (state). Tente ligar novamente." },
  token_exchange: {
    text: "Não foi possível trocar o código por um token. Verifique o client_secret e o redirect_uri.",
  },
};

export default async function IntegrationsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string; detail?: string }>;
}) {
  await requireAdmin();
  const conn = await getConnection();
  const status = toStatus(conn);

  const sp = await searchParams;
  const banner = sp.connected
    ? CALLBACK_MESSAGES[sp.connected]
    : sp.error === "oauth" && sp.detail
      ? { text: `O TOConline recusou a autorização: ${sp.detail}.` }
      : sp.error
        ? CALLBACK_MESSAGES[sp.error] ?? { text: "Ocorreu um erro na ligação." }
        : null;

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Integrações</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Ligação ao TOConline para emitir faturas fiscais (ATCUD, QR, numeração
        certificada). As credenciais são obtidas na sua conta TOConline (app de
        API) e ficam guardadas apenas nesta instalação.
      </p>

      <div
        className="mt-4 max-w-xl rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-foreground"
        role="note"
      >
        <strong>Atenção:</strong> a emissão no TOConline é definitiva — os
        documentos são finalizados no momento do envio e não podem ser anulados
        pela API. A primeira emissão real será feita por si, deliberadamente.
      </div>

      {banner && (
        <div
          role="status"
          className={`mt-4 max-w-xl rounded-lg border p-3 text-sm ${
            banner.ok
              ? "border-foreground/20 bg-muted text-foreground"
              : "border-destructive/30 bg-destructive/5 text-destructive"
          }`}
        >
          {banner.text}
        </div>
      )}

      <div className="mt-6">
        <ToconlineForm status={status} />
      </div>
    </div>
  );
}
