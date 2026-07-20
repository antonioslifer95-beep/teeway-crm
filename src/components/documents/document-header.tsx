import { LogoMark } from "@/components/documents/logo-mark";
import styles from "@/components/documents/document.module.css";

export function DocumentHeader({ title }: { title: string }) {
  return (
    <div className={styles.head}>
      <div className={styles.brand}>
        <LogoMark />
        <div className={styles.lock}>
          <div className={styles.word}>teeway</div>
          <div className={styles.desc}>MOBILITY</div>
        </div>
      </div>
      <div className={styles.docMeta}>
        <div className={styles.title}>{title}</div>
        <div className={styles.legal}>
          Credible Legion Unipessoal Lda · NIPC 519 512 561
          <br />
          Rua François Guichard, n.º 128 B, 5 E · 4100-012 Porto
          <br />
          geral@teeway.pt · teeway.pt
        </div>
      </div>
    </div>
  );
}
