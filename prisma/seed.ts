import "dotenv/config";
import bcrypt from "bcryptjs";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";

// Mirror the runtime setup (src/lib/prisma.ts): the client runs on the WASM
// query compiler, so it needs the Neon driver adapter — a plain new
// PrismaClient() would fail.
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@teeway.pt";
  const password = process.env.SEED_ADMIN_PASSWORD;
  // Required, with no fallback — a hardcoded default would let a weak, publicly
  // known password be (re)created on any seed run.
  if (!password || password.length < 8) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is required (min 8 chars). Set it in .env before seeding.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Admin",
      email,
      passwordHash,
      role: "ADMIN",
    },
  });

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      defaultCustomsDutyPercent: 12.3,
      defaultClearanceFee: 150,
      defaultMarkupPercent: 100,
      vatRate: 23,
      updatedByUserId: admin.id,
    },
  });

  await prisma.toconlineConnection.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  // Note: never log the password. `upsert` with an empty `update` means an
  // existing admin's password is NOT changed by re-seeding — change it in-app.
  console.log(`Seeded admin user: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
