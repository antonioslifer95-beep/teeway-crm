import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  CONNECTION_ID,
  getConnection,
  resolveConfig,
  TocNotConfiguredError,
} from "@/lib/toconline/connection";
import { buildAuthorizationUrl } from "@/lib/toconline/oauth";

// Prisma + crypto need the Node runtime. This route is NOT covered by the auth
// middleware (matcher excludes /api), so it guards itself with requireAdmin.
export const runtime = "nodejs";

const SETTINGS = "/settings/integracoes";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const conn = await getConnection();
  let config;
  try {
    config = resolveConfig(conn);
  } catch (err) {
    if (err instanceof TocNotConfiguredError) {
      return NextResponse.redirect(
        new URL(`${SETTINGS}?error=not_configured`, request.url),
      );
    }
    throw err;
  }

  // Store an anti-CSRF state to re-check on the callback.
  const state = randomUUID();
  await prisma.toconlineConnection.update({
    where: { id: CONNECTION_ID },
    data: { authState: state },
  });

  return NextResponse.redirect(buildAuthorizationUrl(config, state));
}
