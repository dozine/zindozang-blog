import styles from "./featured.module.css";
import Image from "next/image";
import Link from "next/link";

const Featured = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerLeft}>ZINDOZANG — SEOUL, KR</span>
        <span className={styles.headerRight}>EST. 2026</span>
      </div>

      {/* 메인 그리드 */}
      <div className={styles.grid}>
        {/* A: 큰 이미지 — 좌상단 */}
        <div className={`${styles.cell} ${styles.cellA}`}>
          <Image
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80"
            alt="cover"
            fill
            style={{
              objectFit: "cover",
              filter: "grayscale(100%) contrast(1.1)",
            }}
            priority
            sizes="40vw"
          />
        </div>

        {/* B: 메인 타이포 — 우상단 */}
        <div className={`${styles.cell} ${styles.cellB}`}>
          <p className={styles.label}>NOTES FROM THE MARGIN</p>
          <h1 className={styles.headline}>
            SLOWLY
            <br />
            BUILDING
            <br />
            THINGS.
          </h1>
          <p className={styles.sub}>Frontend Developer × Writer</p>
        </div>

        {/* C: 날짜/정보 — 좌중단 */}
        <div className={`${styles.cell} ${styles.cellC}`}>
          <div className={styles.infoBlock}>
            <span className={styles.infoLabel}>LOCATION</span>
            <span className={styles.infoValue}>SEOUL, KR</span>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.infoLabel}>ISSUE</span>
            <span className={styles.infoValue}>VOL.01 — 2026</span>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.infoLabel}>ABOUT</span>
            <span className={styles.infoValue}>CODE × LIFE</span>
          </div>
        </div>

        {/* D: 작은 이미지 — 중앙 */}
        <div className={`${styles.cell} ${styles.cellD}`}>
          <Image
            src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80"
            alt="cover2"
            fill
            style={{
              objectFit: "cover",
              filter: "grayscale(100%) contrast(1.1)",
            }}
            sizes="25vw"
          />
        </div>

        {/* E: 작은 이미지 — 우중단 */}
        <div className={`${styles.cell} ${styles.cellE}`}>
          <Image
            src="https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80"
            alt="cover3"
            fill
            style={{
              objectFit: "cover",
              filter: "grayscale(100%) contrast(1.1)",
            }}
            sizes="25vw"
          />
        </div>

        {/* F: 하단 텍스트 + 버튼 */}
        <div className={`${styles.cell} ${styles.cellF}`}>
          <p className={styles.footerText}>
            개발하며 배운 것들,
            <br />
            살아가며 느낀 것들.
          </p>
          <Link href="/blog" className={styles.enterButton}>
            ENTER →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Featured;
