import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  CONNECTION_ID,
  getConnection,
  resolveConfig,
} from "@/lib/toconline/connection";
import { exchangeCodeForToken } from "@/lib/toconline/oauth";

export const runtime = "nodejs";

const SETTINGS = "/settings/integracoes";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const back = (q: string) =>
    NextResponse.redirect(new URL(`${SETTINGS}?${q}`, request.url));

  // TOConline returned an OAuth error instead of a code — surface it verbatim
  // (e.g. invalid_request) rather than a generic "no code" message.
  if (oauthError) return back(`error=oauth&detail=${encodeURIComponent(oauthError)}`);
  if (!code || !state) return back("error=missing_code");

  const conn = await getConnection();
  // Constant-ish state check: reject if absent or mismatched.
  if (!conn.authState || conn.authState !== state) return back("error=bad_state");

  let config;
  try {
    config = resolveConfig(conn);
  } catch {
    return back("error=not_configured");
  }

  try {
    const tokens = await exchangeCodeForToken(config, code);
    await prisma.toconlineConnection.update({
      where: { id: CONNECTION_ID },
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        scope: tokens.scope,
        expiresAt: tokens.expiresAt,
        obtainedAt: tokens.obtainedAt,
        authState: null, // consume the one-time state
      },
    });
  } catch {
    // Clear the used state either way so a stale one can't linger.
    await prisma.toconlineConnection.update({
      where: { id: CONNECTION_ID },
      data: { authState: null },
    });
    return back("error=token_exchange");
  }

  return back("connected=1");
}
