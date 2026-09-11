import "server-only";

import { prisma } from "@/lib/prisma";
import type { ToconlineConnection } from "@/generated/prisma/client";
import { refreshAccessToken, isExpired } from "./oauth";
import { type TocConfig, type TocTokens, TocApiError } from "./types";

/**
 * Server-only bridge between the DB-stored `ToconlineConnection` and the pure
 * TOConline library. Owns config resolution and the refresh-then-persist token
 * lifecycle. NOT re-exported from index.ts, so the pure library stays free of
 * `server-only` and can be imported anywhere.
 */

export const CONNECTION_ID = 1;

/** Thrown when the app registration (base URLs / client id+secret / redirect)
 *  hasn't been filled in yet under Settings → Integrações. */
export class TocNotConfiguredError extends Error {
  constructor() {
    super("TOConline connection is not configured");
    this.name = "TocNotConfiguredError";
  }
}

/** Thrown when config exists but no OAuth session does (never connected, or
 *  disconnected). */
export class TocNotConnectedError extends Error {
  constructor() {
    super("TOConline is not connected");
    this.name = "TocNotConnectedError";
  }
}

export async function getConnection(): Promise<ToconlineConnection> {
  const existing = await prisma.toconlineConnection.findUnique({
    where: { id: CONNECTION_ID },
  });
  if (existing) return existing;
  return prisma.toconlineConnection.create({ data: { id: CONNECTION_ID } });
}

/** Build a {@link TocConfig} from the stored row, or throw if incomplete. */
export function resolveConfig(conn: ToconlineConnection): TocConfig {
  if (
    !conn.apiBaseUrl ||
    !conn.oauthBaseUrl ||
    !conn.clientId ||
    !conn.clientSecret ||
    !conn.redirectUri
  ) {
    throw new TocNotConfiguredError();
  }
  return {
    baseUrl: conn.apiBaseUrl.replace(/\/+$/, ""),
    oauthBaseUrl: conn.oauthBaseUrl.replace(/\/+$/, ""),
    clientId: conn.clientId,
    clientSecret: conn.clientSecret,
    redirectUri: conn.redirectUri,
    environment: conn.environment,
  };
}

function tokensFromRow(conn: ToconlineConnection): TocTokens | null {
  if (!conn.accessToken) return null;
  return {
    accessToken: conn.accessToken,
    refreshToken: conn.refreshToken,
    scope: conn.scope,
    expiresAt: conn.expiresAt,
    obtainedAt: conn.obtainedAt ?? new Date(),
  };
}

/** Persist a freshly-acquired/refreshed token set onto the singleton. */
export async function persistTokens(tokens: TocTokens): Promise<void> {
  await prisma.toconlineConnection.update({
    where: { id: CONNECTION_ID },
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      scope: tokens.scope,
      expiresAt: tokens.expiresAt,
      obtainedAt: tokens.obtainedAt,
    },
  });
}

/**
 * Return a valid access token, transparently refreshing (and persisting the new
 * token) when the stored one is expired. Throws {@link TocNotConfiguredError}
 * or {@link TocNotConnectedError} as appropriate.
 */
export async function getFreshAccessToken(): Promise<{
  config: TocConfig;
  accessToken: string;
}> {
  const conn = await getConnection();
  const config = resolveConfig(conn);
  const tokens = tokensFromRow(conn);
  if (!tokens) throw new TocNotConnectedError();

  if (isExpired(tokens)) {
    if (!tokens.refreshToken) throw new TocNotConnectedError();
    const refreshed = await refreshAccessToken(config, tokens.refreshToken);
    await persistTokens(refreshed);
    return { config, accessToken: refreshed.accessToken };
  }
  return { config, accessToken: tokens.accessToken };
}

/** Shape for the settings UI — never exposes the secret or tokens. */
export interface TocConnectionStatus {
  configured: boolean;
  connected: boolean;
  environment: ToconlineConnection["environment"];
  expiresAt: Date | null;
  obtainedAt: Date | null;
  apiBaseUrl: string | null;
  oauthBaseUrl: string | null;
  clientId: string | null;
  redirectUri: string | null;
  hasClientSecret: boolean;
}

export function toStatus(conn: ToconlineConnection): TocConnectionStatus {
  const configured = Boolean(
    conn.apiBaseUrl &&
      conn.oauthBaseUrl &&
      conn.clientId &&
      conn.clientSecret &&
      conn.redirectUri,
  );
  return {
    configured,
    connected: Boolean(conn.accessToken),
    environment: conn.environment,
    expiresAt: conn.expiresAt,
    obtainedAt: conn.obtainedAt,
    apiBaseUrl: conn.apiBaseUrl,
    oauthBaseUrl: conn.oauthBaseUrl,
    clientId: conn.clientId,
    redirectUri: conn.redirectUri,
    hasClientSecret: Boolean(conn.clientSecret),
  };
}

/** Re-export so callers can catch API errors without reaching into types. */
export { TocApiError };
