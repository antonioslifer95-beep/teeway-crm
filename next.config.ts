import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Prisma client is generated to a custom path (src/generated/prisma), and
  // Next's serverless file-tracing can miss the engine .so.node there — force it
  // into every function bundle so queries work on Vercel's Lambda runtime.
  outputFileTracingIncludes: {
    "/**/*": ["./src/generated/prisma/**/*"],
  },
};

export default nextConfig;
