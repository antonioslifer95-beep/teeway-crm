import { prisma } from "@/lib/prisma";

export async function getSettings() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (settings) return settings;

  return prisma.settings.create({
    data: {
      id: 1,
      defaultCustomsDutyPercent: 12.3,
      defaultClearanceFee: 150,
      defaultMarkupPercent: 100,
      vatRate: 23,
    },
  });
}
