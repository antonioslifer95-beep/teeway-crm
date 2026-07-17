import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@teeway.pt";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "teeway-admin-2026";

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

  console.log(`Seeded admin user: ${email} / ${password}`);
  console.log("Change this password after first login.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
