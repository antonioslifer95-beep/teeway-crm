import { LogoMarkFilled } from "@/components/documents/logo-mark";
import styles from "@/components/documents/document.module.css";

export function DocumentFooter() {
  return (
    <div className={styles.foot}>
      <LogoMarkFilled />
      <div>
        <div className={styles.l1}>
          Teeway Mobility é uma marca comercial de Credible Legion Unipessoal Lda
        </div>
        <div className={styles.l2}>
          NIPC 519 512 561 · Sociedade por Quotas · Rua François Guichard, n.º 128
          B, 5 E · 4100-012 Porto · Gerência: Catarina Pinto de Azevedo ·
          geral@teeway.pt · teeway.pt
        </div>
      </div>
    </div>
  );
}
