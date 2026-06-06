import styles from "./homepage.module.css";
import Link from "next/link";
import { getAllCategories } from "@/lib/data/category";
import ZindozangLogo from "@/components/logo/zindozang";

export default async function HomePage() {
  const categories = await getAllCategories();

  const now = new Date();
  const month = now.toLocaleDateString("en-US", { month: "long" });
  const year = now.getFullYear();
  const dayNum = now.getDate();

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const dateStr = `${month} ${dayNum}${getOrdinalSuffix(dayNum)}. ${year}`;

  return (
    <main className={styles.page}>
      <div className={styles.left}>
        <div className={styles.meta}>
          <span>{dateStr}</span>
          <span>Seoul. KR</span>
        </div>
        <h1 className={styles.title}>
          <span className={styles.titleRight}>ZiNDOZANG</span>
        </h1>
        <div className={styles.logoWrap}>
          <ZindozangLogo />
        </div>
        <div className={styles.titleDesc}>
          ZINDOZANG IS MY PERSONAL ARCHIVE — THE LIFE AND RAW THOUGHTS OF A
          DEVELOPER BASED IN SEOUL. NO NEWSLETTERS. NO ALGORITHMS. NO FILTERS.
          WON'T WRITE OFTEN, BUT I'LL WRITE WHEN IT MATTERS. INSPIRED BY
          BRUTALISM. DJ PUMP THIS PARTY!
        </div>
      </div>
      <div className={styles.right}>
        <Link href="/blog" className={styles.catItem}>
          <div className={styles.catLeft}>
            <span className={styles.catNum}>00</span>
            <span className={styles.catName}>All</span>
          </div>
          <span className={styles.catArrow}>↗</span>
        </Link>
        {categories.map((cat, i) => (
          <Link
            key={cat.id}
            href={`/blog?cat=${cat.slug}`}
            className={styles.catItem}
          >
            <div className={styles.catLeft}>
              <span className={styles.catNum}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className={styles.catName}>{cat.title}</span>
            </div>
            <span className={styles.catArrow}>↗</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
