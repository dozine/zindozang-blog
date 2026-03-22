import styles from "./marquee.module.css";

const items = [
  "ZINDOZANG",
  "ZINDOZANG",
  "ZINDOZANG",
  "ZINDOZANG",
  "ZINDOZANG",
  "ZINDOZANG",
  "ZINDOZANG",
  "ZINDOZANG",
  "ZINDOZANG",
  "ZINDOZANG",
];

const Marquee = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.track}>
        {/* 두 번 반복해야 끊김 없이 무한 루프 */}
        {[...items, ...items].map((item, i) => (
          <span key={i} className={styles.item}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
