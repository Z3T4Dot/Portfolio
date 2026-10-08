import type { ReactNode } from "react";
import styles from "./Section.module.css";

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={styles.section}>
      <h2 id={`${id}-title`}>{title}</h2>
      {children}
    </section>
  );
}
