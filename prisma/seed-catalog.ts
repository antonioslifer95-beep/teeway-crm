/**
 * Seeds the Teeway range into CartModel.
 *
 * Source of truth: documents/gama-teeway.md (which is itself extracted from the
 * Varyon brochure). Keep the two in step — if a name changes there, change it
 * here and re-run.
 *
 * `code` is the FACTORY code and `name` is the Teeway commercial name. That
 * split is deliberate: the CE declaration, the UN 38.3 report and every purchase
 * order name the vehicle by its Varyon code, so the code has to survive in the
 * database even though customers never see it.
 *
 * Idempotent — upserts by code, so re-running only refreshes names and specs and
 * never touches `defaultGoodsCostOriginal` on models that already exist.
 *
 * Run:  npx tsx prisma/seed-catalog.ts
 */
import "dotenv/config";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface CatalogEntry {
  code: string;
  name: string;
  seats: number;
  /** Length in mm. Omitted where the brochure figure is under query. */
  length?: number;
  motorKw: string;
  line: string;
  tyres: string;
}

const COMMON = "30 km/h · autonomia 80–100 km · inclinação 25 %";

/** Fairway (A) · 1200 mm wide · 10" grass tyres */
const FAIRWAY: CatalogEntry[] = [
  { code: "VY-A2", name: "Fairway 2", seats: 2, length: 2350, motorKw: "3,5 kW", line: "Fairway", tyres: '10" relva 205/50-10' },
  { code: "VY-A2+2", name: "Fairway 4R", seats: 4, length: 2800, motorKw: "4,0 kW", line: "Fairway", tyres: '10" relva 205/50-10' },
  { code: "VY-A4", name: "Fairway 4", seats: 4, length: 3100, motorKw: "4,0 kW", line: "Fairway", tyres: '10" relva 205/50-10' },
  { code: "VY-A4+2", name: "Fairway 6R", seats: 6, length: 3450, motorKw: "4,0 kW", line: "Fairway", tyres: '10" relva 205/50-10' },
  { code: "VY-A6", name: "Fairway 6", seats: 6, length: 3950, motorKw: "4,0 kW", line: "Fairway", tyres: '10" relva 205/50-10' },
  { code: "VY-A6+2", name: "Fairway 8R", seats: 8, length: 4300, motorKw: "4,0 kW", line: "Fairway", tyres: '10" relva 205/50-10' },
  { code: "VY-A8", name: "Fairway 8", seats: 8, length: 4700, motorKw: "4,0 kW", line: "Fairway", tyres: '10" relva 205/50-10' },
  { code: "VY-A8+2", name: "Fairway 10R", seats: 10, length: 5000, motorKw: "4,0 kW", line: "Fairway", tyres: '10" relva 205/50-10' },
  { code: "VY-A10", name: "Fairway 10", seats: 10, length: 5000, motorKw: "4,0 kW", line: "Fairway", tyres: '10" relva 205/50-10' },
  { code: "VY-A10+2", name: "Fairway 12", seats: 12, length: 5000, motorKw: "4,0 kW", line: "Fairway", tyres: '10" relva 205/50-10' },
];

/** Trail (B) · 1350 mm wide · 12" · McPherson suspension */
const TRAIL: CatalogEntry[] = [
  { code: "VY-B2", name: "Trail 2", seats: 2, length: 2600, motorKw: "4,0 kW", line: "Trail", tyres: '12" relva' },
  { code: "VY-B2+2", name: "Trail 4R", seats: 4, length: 2900, motorKw: "4,0 kW", line: "Trail", tyres: '12" relva' },
  { code: "VY-B4", name: "Trail 4", seats: 4, length: 3200, motorKw: "4,0 kW", line: "Trail", tyres: '12" relva' },
  { code: "VY-B4+2", name: "Trail 6R", seats: 6, length: 3700, motorKw: "4,0 kW", line: "Trail", tyres: '12" relva' },
  { code: "VY-B6", name: "Trail 6", seats: 6, length: 3900, motorKw: "4,0 kW", line: "Trail", tyres: '12" relva' },
  { code: "VY-B6+2", name: "Trail 8R", seats: 8, length: 4300, motorKw: "5,0 kW", line: "Trail", tyres: '12" relva' },
];

/** Grand (C) · 1350 mm wide · 12" · top of range */
const GRAND: CatalogEntry[] = [
  { code: "VY-C2", name: "Grand 2", seats: 2, length: 2650, motorKw: "4,0 kW", line: "Grand", tyres: '12" relva' },
  { code: "VY-C2+2", name: "Grand 4R", seats: 4, length: 2950, motorKw: "4,0 kW", line: "Grand", tyres: '12" relva' },
  { code: "VY-C4", name: "Grand 4", seats: 4, length: 3350, motorKw: "4,0 kW", line: "Grand", tyres: '12" relva' },
  { code: "VY-C4+2", name: "Grand 6R", seats: 6, length: 3650, motorKw: "4,0 kW", line: "Grand", tyres: '12" relva' },
  { code: "VY-C6", name: "Grand 6", seats: 6, length: 3900, motorKw: "4,0 kW", line: "Grand", tyres: '12" relva' },
  { code: "VY-C6+2", name: "Grand 8R", seats: 8, length: 4300, motorKw: "5,0 kW", line: "Grand", tyres: '12" relva' },
];

/** Vertex (D) · 1350 mm wide · 12" · SUV styling */
const VERTEX: CatalogEntry[] = [
  { code: "VY-D2", name: "Vertex 2", seats: 2, length: 2950, motorKw: "4,0 kW", line: "Vertex", tyres: '12" relva' },
  // Length deliberately omitted: the brochure gives 2650 mm, shorter than the
  // 2-seat Vertex 2, which cannot be right. Query open with the factory.
  { code: "VY-D2+2", name: "Vertex 4R", seats: 4, motorKw: "4,0 kW", line: "Vertex", tyres: '12" relva' },
  { code: "VY-D4", name: "Vertex 4", seats: 4, length: 3350, motorKw: "4,0 kW", line: "Vertex", tyres: '12" relva' },
  { code: "VY-D4+2", name: "Vertex 6R", seats: 6, length: 3650, motorKw: "4,0 kW", line: "Vertex", tyres: '12" relva' },
];

const PASSENGER = [...FAIRWAY, ...TRAIL, ...GRAND, ...VERTEX];

/**
 * Utility line — not in the brochure, described from the units we have sold and
 * from the FD005A-2GX specification sheet. "Cargo 2" is deliberately absent: we
 * do not yet know whether the hydraulic tipping bed is its own factory model or
 * a special body on a Fairway 2.
 */
const UTILITY: { code: string; name: string; seats: number; description: string }[] = [
  {
    code: "VY-L4",
    name: "Chill 2",
    seats: 2,
    description:
      'Linha utilitária · 2 lugares · câmara frigorífica ativa, evaporador no teto interior e grupo de frio sobre a caixa · pneus 12" relva · ' +
      COMMON,
  },
  {
    code: "FD005A-2GX",
    name: "Thermo 2",
    seats: 2,
    description:
      "Linha utilitária · 2 lugares · caixa isotérmica fechada integrada na traseira, duas portas · 3200×1200×1980 mm · motor 3,5 kW · 35 km/h · " +
      "autonomia 80–100 km · inclinação 25 %",
  },
];

function describe(entry: CatalogEntry): string {
  // Fairway is the narrow body; every other line is 1350 mm wide.
  const width = entry.line === "Fairway" ? 1200 : 1350;
  const dims = entry.length ? `${entry.length}×${width}×1980 mm · ` : "";
  return `Linha ${entry.line} · ${entry.seats} lugares · ${dims}motor ${entry.motorKw} assíncrono AC · pneus ${entry.tyres} · ${COMMON}`;
}

async function main() {
  let created = 0;
  let updated = 0;

  for (const entry of PASSENGER) {
    const result = await prisma.cartModel.upsert({
      where: { code: entry.code },
      // Refresh the commercial name and the spec text; leave the reference cost
      // alone so a hand-entered value is never wiped by a re-run.
      update: {
        name: entry.name,
        seats: entry.seats,
        defaultDescription: describe(entry),
      },
      create: {
        code: entry.code,
        name: entry.name,
        seats: entry.seats,
        defaultDescription: describe(entry),
        // Unknown until the factory quotes it. Zero is a placeholder, not a
        // price: it only pre-fills the order form, where it must be typed over.
        defaultGoodsCostOriginal: 0,
      },
      select: { createdAt: true, updatedAt: true },
    });
    if (result.createdAt.getTime() === result.updatedAt.getTime()) created++;
    else updated++;
  }

  for (const entry of UTILITY) {
    const result = await prisma.cartModel.upsert({
      where: { code: entry.code },
      update: {
        name: entry.name,
        seats: entry.seats,
        defaultDescription: entry.description,
      },
      create: {
        code: entry.code,
        name: entry.name,
        seats: entry.seats,
        defaultDescription: entry.description,
        defaultGoodsCostOriginal: 0,
      },
      select: { createdAt: true, updatedAt: true },
    });
    if (result.createdAt.getTime() === result.updatedAt.getTime()) created++;
    else updated++;
  }

  const total = await prisma.cartModel.count();
  console.log(
    `Catálogo Teeway: ${created} criados, ${updated} atualizados. ` +
      `${PASSENGER.length} passageiros + ${UTILITY.length} utilitários. ` +
      `Total de modelos na base: ${total}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
