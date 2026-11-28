import styles from "./editorLayout.module.css";

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.layout}>{children}</div>;
}
