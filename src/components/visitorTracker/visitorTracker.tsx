"use client";

import styles from "./visitorTracker.module.css";
import { useVisitorTracker } from "@/hooks/visitor/useVisitorTracker";

export default function VisitorTracker() {
  const { stats, loading, error } = useVisitorTracker();

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.stat}>
          <span className={styles.label}>로딩중...</span>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.stat}>
          <span className={styles.label}>통계 로드 실패</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.stat}>
        <span className={styles.label}>Today</span>
        <span className={styles.count}>{stats.todayVisitors.toLocaleString()}</span>
      </div>
      <div className={styles.divider}></div>
      <div className={styles.stat}>
        <span className={styles.label}>Total</span>
        <span className={styles.count}>{stats.totalVisitors.toLocaleString()}</span>
      </div>
    </div>
  );
}
