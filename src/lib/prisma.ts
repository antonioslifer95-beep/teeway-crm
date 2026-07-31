import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Neon's serverless driver talks over WebSockets for sessions/transactions
// (Prisma runs nested writes in a transaction), so give it a WS constructor —
// Node's global WebSocket isn't guaranteed across runtimes. Simple pool queries
// go over HTTP fetch, which needs no socket.
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Driver adapter (not the native query engine): Prisma uses its platform-
// independent WASM engine + this JS adapter, so there's no rhel-openssl
// `.so.node` to bundle — the whole "could not locate the Query Engine" class
// of Vercel deploy failures goes away, and Neon gets proper serverless pooling.
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
