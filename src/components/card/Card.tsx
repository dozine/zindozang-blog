import Image from "next/image";
import styles from "./card.module.css";
import Link from "next/link";
import { CardProps } from "@/types";
import { extractTextFromMarkdown } from "@/lib/utils/markdown";

const Card = ({ item, priority = false, index = 0 }: CardProps) => {
  const shouldPrioritize = priority || index < 3;
  return (
    <Link href={`/posts/${item.slug}`}>
      <div className={styles.container}>
        <div className={styles.detail}>
          <span className={styles.date}>
            {item.createdAt instanceof Date
              ? item.createdAt.toISOString().substring(0, 10)
              : new Date(item.createdAt).toISOString().substring(0, 10)}
          </span>
          <span className={styles.category}>{item.catSlug}</span>
        </div>

        {/* 2. 이미지 */}
        {Array.isArray(item.img) && item.img.length > 0 && item.img[0].trim() !== "" ? (
          <div className={styles.imageContainer}>
            <div className={styles.image}>
              <Image
                src={item.img[0]}
                alt={item.title || "포스트 이미지"}
                fill
                style={{ objectFit: "cover" }}
                priority={shouldPrioritize}
                loading={shouldPrioritize ? "eager" : "lazy"}
                sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
                quality={80}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
              />
            </div>
          </div>
        ) : (
          <div className={styles.imagePlaceholder}>
            <svg
              className={styles.imagePlaceholderIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              width="36"
              height="36"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}

        <div className={styles.textContainer}>
          <div className={styles.titleContainer}>
            <h1 className={styles.title}>{item.title}</h1>
          </div>
          <p className={styles.desc}>
            {(() => {
              if (!item.desc) return "";
              const descText = extractTextFromMarkdown(item.desc);
              return descText.length > 60 ? descText.substring(0, 60) + "..." : descText;
            })()}
          </p>
          {/* {item.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
            <div className={styles.tagContainer}>
              {item.tags.map((tag) => (
                <span key={tag.id || tag.name} className={styles.tag}>
                  {tag.name}
                </span>
              ))}
            </div>
          )} */}
        </div>
      </div>
    </Link>
  );
};

export default Card;
