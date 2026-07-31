/**
 * Read-only: says which Neon branch DATABASE_URL currently points at, by
 * fingerprinting the data. Run this before any write against production.
 *
 *   $env:DATABASE_URL = "<prod url>"; npx tsx prisma/whoami-db.ts
 */
import "dotenv/config";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

const url = process.env.DATABASE_URL ?? "";
const host = url ? new URL(url).hostname : "(sem DATABASE_URL)";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: url }),
});

async function main() {
  const [users, clients, models, quotes, invoices, orders] = await Promise.all([
    prisma.user.count(),
    prisma.client.count(),
    prisma.cartModel.count(),
    prisma.quote.count(),
    prisma.invoice.count(),
    prisma.order.count(),
  ]);

  console.log(`endpoint : ${host}`);
  console.log(
    `contagens: ${users} utilizadores · ${clients} clientes · ${models} modelos · ` +
      `${quotes} orçamentos · ${invoices} faturas · ${orders} encomendas`,
  );

  const teste = await prisma.cartModel.findFirst({ where: { code: "VY-M3TEST" } });
  console.log(`modelo de teste VY-M3TEST presente: ${teste ? "SIM" : "não"}`);

  // A produção foi limpa a 2026-07-31: ficou só o admin e os singletons.
  const pareceProducao = clients === 0 && quotes === 0 && invoices === 0 && !teste;
  console.log(
    pareceProducao
      ? "\n=> parece a PRODUÇÃO (sem dados de negócio, sem modelo de teste)"
      : "\n=> NÃO parece a produção — tem dados de negócio ou o modelo de teste",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
