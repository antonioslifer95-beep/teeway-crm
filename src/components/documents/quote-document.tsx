import { DocumentHeader } from "@/components/documents/document-header";
import { DocumentFooter } from "@/components/documents/document-footer";
import { formatDatePT, formatEUR } from "@/lib/format";
import styles from "@/components/documents/document.module.css";
import type { Client, Quote, QuoteLine } from "@/generated/prisma/client";

type QuoteWithRelations = Quote & {
  client: Client;
  lines: QuoteLine[];
};

export function QuoteDocument({ quote }: { quote: QuoteWithRelations }) {
  const clientLines = [
    quote.client.nif ? `NIF ${quote.client.nif}` : null,
    [quote.client.addressLine, [quote.client.postalCode, quote.client.city].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(" · "),
  ].filter(Boolean);

  return (
    <div className={styles.page}>
      <DocumentHeader title="ORÇAMENTO" />

      <div className={styles.docBody}>
        <div className={styles.meta}>
          <div className={styles.col}>
            <div className={styles.label}>Para</div>
            <div className={styles.party}>
              {quote.client.companyName}
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
                <dt>N.º de orçamento</dt>
                <dd>{quote.quoteNumber}</dd>
                <dt>Data</dt>
                <dd>{formatDatePT(quote.issueDate)}</dd>
                <dt>Válido até</dt>
                <dd>{quote.validUntil ? formatDatePT(quote.validUntil) : "—"}</dd>
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
              <th className={styles.num}>Preço unit. s/IVA</th>
              <th className={styles.num}>Total s/IVA</th>
            </tr>
          </thead>
          <tbody>
            {quote.lines.map((line, i) => (
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
                <td className={`${styles.num} ${styles.total}`}>
                  {formatEUR(line.lineTotalExVat)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.totals}>
          <div className={styles.totalsBox}>
            <div className={styles.totalsLine}>
              <span>Subtotal s/IVA</span>
              <span>{formatEUR(quote.subtotalExVat)}</span>
            </div>
            <div className={styles.totalsLine}>
              <span>IVA</span>
              <span>{formatEUR(quote.vatAmount)}</span>
            </div>
            <div className={styles.grand}>
              <span className={styles.k}>Total c/IVA</span>
              <span className={styles.v}>{formatEUR(quote.totalIncVat)}</span>
            </div>
          </div>
        </div>

        <div className={styles.terms}>
          <div className={styles.label}>Condições</div>
          <div className={styles.grid}>
            <div className={styles.item}>
              <div className={styles.k}>Entrega</div>
              <div className={styles.v}>{quote.deliveryTerms || "—"}</div>
            </div>
            <div className={styles.item}>
              <div className={styles.k}>Pagamento</div>
              <div className={styles.v}>{quote.paymentTerms || "—"}</div>
            </div>
            <div className={styles.item}>
              <div className={styles.k}>Validade</div>
              <div className={styles.v}>
                {quote.validUntil
                  ? `Válido até ${formatDatePT(quote.validUntil)}.`
                  : "—"}
              </div>
            </div>
            <div className={styles.item}>
              <div className={styles.k}>Impostos</div>
              <div className={styles.v}>
                Valores acrescidos de IVA à taxa legal em vigor. Preços em euros.
              </div>
            </div>
          </div>
          <div className={styles.note}>
            Este documento é um orçamento e não constitui fatura. A aceitação
            implica a confirmação por escrito das condições acima.
          </div>
        </div>
      </div>

      <DocumentFooter />
    </div>
  );
}
