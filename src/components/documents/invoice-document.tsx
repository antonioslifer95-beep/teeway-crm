import { DocumentHeader } from "@/components/documents/document-header";
import { DocumentFooter } from "@/components/documents/document-footer";
import { formatDatePT, formatEUR } from "@/lib/format";
import styles from "@/components/documents/document.module.css";
import type { Client, Invoice, InvoiceLine } from "@/generated/prisma/client";

type InvoiceWithRelations = Invoice & {
  client: Client;
  lines: InvoiceLine[];
};

export function InvoiceDocument({ invoice }: { invoice: InvoiceWithRelations }) {
  const clientLines = [
    invoice.client.nif ? `NIF ${invoice.client.nif}` : null,
    [
      invoice.client.addressLine,
      [invoice.client.postalCode, invoice.client.city].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join(" · "),
  ].filter(Boolean);

  const vatGroups = new Map<string, { base: number; vat: number }>();
  for (const line of invoice.lines) {
    const rate = Number(line.vatRate).toString();
    const base = Number(line.lineTotalExVat);
    const vat = Number(line.lineTotalIncVat) - base;
    const existing = vatGroups.get(rate) ?? { base: 0, vat: 0 };
    vatGroups.set(rate, { base: existing.base + base, vat: existing.vat + vat });
  }

  return (
    <div className={styles.page}>
      <div className={styles.watermark}>
        <span>Pré-visualização — não é documento fiscal</span>
      </div>

      <DocumentHeader title="FATURA" />

      <div className={styles.docBody}>
        <div className={styles.meta}>
          <div className={styles.col}>
            <div className={styles.label}>Adquirente</div>
            <div className={styles.party}>
              {invoice.client.companyName}
              {clientLines.map((line, i) => (
                <div key={i} className={styles.row}>
                  {line}
                </div>
              ))}
            </div>
          </div>
          <div className={styles.col}>
            <div className={styles.label}>Detalhes</div>
            <div className={styles.details}>
              <dl>
                <dt>Fatura n.º (interna)</dt>
                <dd>{invoice.internalRef}</dd>
                <dt>Data de emissão</dt>
                <dd>{invoice.issueDate ? formatDatePT(invoice.issueDate) : "—"}</dd>
                <dt>Data de vencimento</dt>
                <dd>{invoice.dueDate ? formatDatePT(invoice.dueDate) : "—"}</dd>
              </dl>
            </div>
          </div>
        </div>

        <table className={styles.items}>
          <thead>
            <tr>
              <th className={styles.ct}>N.º</th>
              <th>Descrição</th>
              <th className={styles.ct}>Qtd</th>
              <th className={styles.num}>Preço unit.</th>
              <th className={styles.ct}>IVA</th>
              <th className={styles.num}>Total s/IVA</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, i) => (
              <tr key={line.id}>
                <td className={styles.ct}>{i + 1}</td>
                <td className={styles.itemDesc}>
                  <div className={styles.name}>{line.name}</div>
                  {line.specText && (
                    <div className={styles.spec}>{line.specText}</div>
                  )}
                </td>
                <td className={styles.ct}>{line.quantity}</td>
                <td className={styles.num}>{formatEUR(line.unitSellPriceExVat)}</td>
                <td className={styles.ct}>{Number(line.vatRate)}%</td>
                <td className={`${styles.num} ${styles.total}`}>
                  {formatEUR(line.lineTotalExVat)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.lower}>
          <div className={styles.vat}>
            <div className={styles.label}>Resumo de IVA</div>
            <table>
              <thead>
                <tr>
                  <th>Taxa</th>
                  <th>Incidência</th>
                  <th>IVA</th>
                </tr>
              </thead>
              <tbody>
                {[...vatGroups.entries()].map(([rate, sums]) => (
                  <tr key={rate}>
                    <td>{rate}%</td>
                    <td>{formatEUR(sums.base)}</td>
                    <td>{formatEUR(sums.vat)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.totalsBox}>
            <div className={styles.totalsLine}>
              <span>Subtotal s/IVA</span>
              <span>{formatEUR(invoice.subtotalExVat)}</span>
            </div>
            <div className={styles.totalsLine}>
              <span>IVA</span>
              <span>{formatEUR(invoice.vatAmount)}</span>
            </div>
            <div className={styles.grand}>
              <span className={styles.k}>Total a pagar</span>
              <span className={styles.v}>{formatEUR(invoice.totalIncVat)}</span>
            </div>
          </div>
        </div>

        <div className={styles.strip}>
          <div className={styles.pay}>
            <div className={styles.k}>Pagamento</div>
            <div className={styles.v}>
              {invoice.paymentTerms || "A acordar."}
            </div>
          </div>
          <div className={styles.previewNotice}>
            <div className={styles.k}>Estado fiscal</div>
            Documento de pré-visualização gerado internamente — ainda não foi
            emitido através do sistema certificado TOConline. Não tem
            número oficial, ATCUD nem código QR.
          </div>
        </div>

        <div className={styles.legalnote}>
          Valores em euros, IVA à taxa legal em vigor. Este documento não
          constitui fatura para efeitos fiscais até ser emitido através de
          programa certificado pela Autoridade Tributária.
        </div>
      </div>

      <DocumentFooter />
    </div>
  );
}
