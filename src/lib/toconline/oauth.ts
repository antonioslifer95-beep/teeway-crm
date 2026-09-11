/**
 * TOConline OAuth 2.0 — authorization-code flow with refresh.
 *
 * Pure functions: they take a {@link TocConfig} + inputs and talk to the OAuth
 * host via `fetch`, returning normalized tokens. Persistence (writing to
 * `ToconlineConnection`) is the caller's job — kept out of here so the flow is
 * unit-testable and storage-agnostic.
 */

import {
  type TocConfig,
  type TocTokenResponse,
  type TocTokens,
  TOC_SCOPE,
  TocApiError,
} from "./types";

/** `Authorization: Basic base64(client_id:secret)` per the docs. */
function basicAuthHeader(config: TocConfig): string {
  const raw = `${config.clientId}:${config.clientSecret}`;
  return `Basic ${Buffer.from(raw, "utf8").toString("base64")}`;
}

function normalizeTokens(payload: TocTokenResponse): TocTokens {
  const obtainedAt = new Date();
  const expiresAt =
    typeof payload.expires_in === "number"
      ? new Date(obtainedAt.getTime() + payload.expires_in * 1000)
      : null;
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    scope: payload.scope ?? TOC_SCOPE,
    expiresAt,
    obtainedAt,
  };
}

/**
 * Build the URL to send the user to so they authorize the app. `state` is an
 * opaque anti-CSRF value the caller generates, stores, and re-checks on return.
 */
export function buildAuthorizationUrl(config: TocConfig, state: string): string {
  const url = new URL(`${config.oauthBaseUrl}/auth`);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", TOC_SCOPE);
  url.searchParams.set("state", state);
  return url.toString();
}

async function requestToken(
  config: TocConfig,
  body: Record<string, string>,
): Promise<TocTokens> {
  const res = await fetch(`${config.oauthBaseUrl}/token`, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(config),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams(body).toString(),
    // Never cache a token exchange.
    cache: "no-store",
  });

  const text = await res.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = text;
  }

  if (!res.ok) {
    throw new TocApiError(
      `TOConline token request failed (${res.status})`,
      res.status,
      payload,
    );
  }
  return normalizeTokens(payload as TocTokenResponse);
}

/** Exchange the authorization code returned to `redirect_uri` for tokens. */
export function exchangeCodeForToken(
  config: TocConfig,
  code: string,
): Promise<TocTokens> {
  return requestToken(config, {
    grant_type: "authorization_code",
    code,
    scope: TOC_SCOPE,
    redirect_uri: config.redirectUri,
  });
}

/** Trade a refresh token for a fresh access token (and, usually, a new refresh
 *  token). Call when the stored access token is at/near expiry. */
export function refreshAccessToken(
  config: TocConfig,
  refreshToken: string,
): Promise<TocTokens> {
  return requestToken(config, {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: TOC_SCOPE,
  });
}

/** Small helper: is this token set expired (or within `skewMs` of expiring)? */
export function isExpired(tokens: TocTokens, skewMs = 60_000): boolean {
  if (!tokens.expiresAt) return false;
  return tokens.expiresAt.getTime() - skewMs <= Date.now();
}
