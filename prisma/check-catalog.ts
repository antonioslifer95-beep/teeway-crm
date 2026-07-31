/** Read-only sanity check of the seeded range. Run: npx tsx prisma/check-catalog.ts */
import "dotenv/config";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

const LINES = ["Fairway", "Trail", "Grand", "Vertex"];

async function main() {
  const models = await prisma.cartModel.findMany({ orderBy: { code: "asc" } });
  console.log(`${models.length} modelos na base\n`);

  for (const line of LINES) {
    const inLine = models.filter((m) => m.name.startsWith(line + " "));
    console.log(
      `${line.padEnd(9)} ${String(inLine.length).padStart(2)}  ` +
        inLine.map((m) => m.name.replace(line + " ", "")).join(", "),
    );
  }

  const utility = models.filter((m) => m.defaultDescription?.startsWith("Linha utilitária"));
  console.log(`${"Utilitária".padEnd(9)} ${String(utility.length).padStart(2)}  ` +
    utility.map((m) => `${m.name} (${m.code})`).join(", "));

  const orphans = models.filter(
    (m) => !LINES.some((l) => m.name.startsWith(l + " ")) && !utility.includes(m),
  );
  if (orphans.length) {
    console.log(`\nFora da gama Teeway (${orphans.length}):`);
    for (const m of orphans) {
      console.log(`  ${m.code} — ${m.name} · custo ${m.defaultGoodsCostOriginal} · ativo=${m.isActive}`);
    }
  }

  const semSeats = models.filter((m) => m.seats == null);
  const semDesc = models.filter((m) => !m.defaultDescription);
  console.log(`\nsem lugares: ${semSeats.length} · sem descrição: ${semDesc.length}`);

  const exemplo = models.find((m) => m.code === "VY-A6");
  console.log(`\nexemplo VY-A6:\n  nome: ${exemplo?.name}\n  spec: ${exemplo?.defaultDescription}`);

  const vertex4r = models.find((m) => m.code === "VY-D2+2");
  console.log(`\nVertex 4R (medida em dúvida, deve sair sem dimensões):\n  ${vertex4r?.defaultDescription}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
