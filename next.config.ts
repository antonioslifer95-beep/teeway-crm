import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Neon serverless driver opens a WebSocket (via `ws`) for write
  // transactions. Bundling `ws` into the server build mangles its frame-masking
  // code ("TypeError: b.mask is not a function"), so every write crashes in a
  // production build while fetch-based reads keep working. Keeping these
  // packages external loads the real modules at runtime instead of the bundled,
  // broken copy.
  // `puppeteer-core` + `@sparticuz/chromium` (server-side invoice PDF) must also
  // stay external: the chromium binary is a brotli blob the bundler would either
  // choke on or strip, breaking `executablePath()` at runtime on Vercel.
  serverExternalPackages: [
    "ws",
    "@neondatabase/serverless",
    "@prisma/adapter-neon",
    "puppeteer-core",
    "@sparticuz/chromium",
  ],
};

export default nextConfig;
