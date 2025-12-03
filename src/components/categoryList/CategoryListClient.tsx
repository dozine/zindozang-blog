"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import styles from "./categoryList.module.css";
import AddCategoryModal from "../categoryModal/AddCategoryModal";
import DeleteCategoryModal from "../categoryModal/DeleteCategoryModal";
import { CategoryListClientProps } from "@/types";
import { useHorizontalScroll } from "@/hooks/category/useHorizontalScroll";
import { useFetchCategories } from "@/hooks/category/useFetchCategories";
import { useModal } from "@/hooks/useModal";

const CategoryListClient = ({ initialCategories }: CategoryListClientProps) => {
  const { status } = useSession();

  const { categories, error, isLoading, refreshCategories } =
    useFetchCategories(initialCategories);
  const {
    sliderRef,
    scrollLeftHandler,
    scrollRightHandler,
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleTouchStart,
    handleTouchMove,
  } = useHorizontalScroll();

  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const {
    isOpen: isAddModalOpen,
    openModal: openAddModal,
    closeModal: closeAddModal,
  } = useModal(false);

  const {
    isOpen: isDeleteModalOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModal(false);

  if (isLoading && categories.length === 0) {
    return <div className={styles.loading}>카테고리 로딩 중...</div>;
  }

  return (
    <div className={styles.container}>
      {status === "authenticated" && (
        <div className={styles.menuContainer}>
          <div className={styles.menuWrapper}>
            <button
              className={styles.menuButton}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              카테고리 관리
            </button>
            {menuOpen && (
              <div className={styles.menu}>
                <button onClick={openAddModal}>추가하기</button>
                <button onClick={openDeleteModal}>삭제하기</button>

                <AddCategoryModal
                  isOpen={isAddModalOpen}
                  onClose={closeAddModal}
                  onSuccess={refreshCategories}
                />
                <DeleteCategoryModal
                  isOpen={isDeleteModalOpen}
                  onClose={closeDeleteModal}
                  onSuccess={refreshCategories}
                  categories={categories}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {(error || error) && <div className={styles.error}>{error}</div>}

      <div className={styles.sliderContainer}>
        <button
          className={`${styles.navButton} ${styles.navButtonLeft}`}
          onClick={scrollLeftHandler}
          aria-label="이전카테고리"
        >
          <span className={styles.navArrow}>←</span>
        </button>
        <div
          className={styles.categoriesSlider}
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleMouseUp}
          onTouchMove={handleTouchMove}
        >
          <div className={styles.categories}>
            <Link
              href="/blog"
              className={`${styles.category} ${styles.allCategory}`}
            >
              <span className={styles.categoryText}>All</span>
            </Link>
            {categories.map((item) => {
              return (
                <Link
                  href={`/blog?cat=${item.slug}`}
                  className={`${styles.category} ${
                    item.slug === "uncategorized" ? styles.uncategorized : ""
                  }`}
                  key={item.id}
                >
                  <span className={styles.categoryText}>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
        <button
          className={`${styles.navButton} ${styles.navButtonRight}`}
          onClick={scrollRightHandler}
          aria-label="다음 카테고리"
        >
          <span className={styles.navArrow}>→</span>
        </button>
      </div>
    </div>
  );
};

export default CategoryListClient;
