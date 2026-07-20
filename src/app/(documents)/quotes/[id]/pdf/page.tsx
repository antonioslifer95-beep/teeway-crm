import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuoteDocument } from "@/components/documents/quote-document";
import { PrintButton } from "@/components/documents/print-button";
import styles from "@/components/documents/document.module.css";

export default async function QuotePdfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      client: true,
      lines: { orderBy: { position: "asc" } },
    },
  });

  if (!quote) notFound();

  return (
    <div>
      <div className={styles.screenChrome}>
        <Link href={`/quotes/${quote.id}`} className="text-sm underline">
          Voltar
        </Link>
        <PrintButton />
      </div>
      <QuoteDocument quote={quote} />
    </div>
  );
}
