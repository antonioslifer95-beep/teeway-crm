/**
 * TOConline integration (M5) — public surface.
 *
 * Config-injected and side-effect-free below the network boundary: OAuth and
 * REST calls take a {@link TocConfig} + token, so this library targets a test
 * tenant or production purely by the config passed in. The server-action layer
 * (token persistence in `ToconlineConnection`, status transitions on `Invoice`,
 * the review-then-issue guard) is built on top of these primitives.
 */

export * from "./types";
export * from "./oauth";
export * from "./mappers";
export * from "./client";
