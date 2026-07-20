import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InvoiceDocument } from "@/components/documents/invoice-document";
import { PrintButton } from "@/components/documents/print-button";
import styles from "@/components/documents/document.module.css";

export default async function InvoicePdfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      lines: { orderBy: { position: "asc" } },
    },
  });

  if (!invoice) notFound();

  return (
    <div>
      <div className={styles.screenChrome}>
        <Link href={`/invoices/${invoice.id}`} className="text-sm underline">
          Voltar
        </Link>
        <PrintButton />
      </div>
      <InvoiceDocument invoice={invoice} />
    </div>
  );
}
