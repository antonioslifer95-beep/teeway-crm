import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
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

  // Render the AT fiscal QR (built from TOConline's certified values) as an
  // inline SVG so it prints crisply.
  const qrSvg = invoice.toconlineQrCodeData
    ? await QRCode.toString(invoice.toconlineQrCodeData, {
        type: "svg",
        margin: 0,
        errorCorrectionLevel: "M",
      })
    : null;

  return (
    <div>
      <div className={styles.screenChrome}>
        <Link href={`/invoices/${invoice.id}`} className="text-sm underline">
          Voltar
        </Link>
        <PrintButton />
      </div>
      <InvoiceDocument invoice={invoice} qrSvg={qrSvg} />
    </div>
  );
}
