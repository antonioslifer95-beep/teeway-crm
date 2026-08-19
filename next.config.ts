import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Neon serverless driver opens a WebSocket (via `ws`) for write
  // transactions. Bundling `ws` into the server build mangles its frame-masking
  // code ("TypeError: b.mask is not a function"), so every write crashes in a
  // production build while fetch-based reads keep working. Keeping these
  // packages external loads the real modules at runtime instead of the bundled,
  // broken copy.
  serverExternalPackages: ["ws", "@neondatabase/serverless", "@prisma/adapter-neon"],
};

export default nextConfig;
