import dynamic from "next/dynamic";
import { Category } from "@prisma/client";
import { CategoryListClientProps } from "@/types";
import { getAllCategories } from "@/lib/data/category"; // 💡 분리된 데이터 함수 import

const CategoryListClient = dynamic<CategoryListClientProps>(
  () => import("./CategoryListClient"),
  {}
);

const CategoryListServer = async () => {
  const categories: Category[] = await getAllCategories();

  if (!categories || categories.length === 0) {
    return <p>카테고리를 불러오는 데 실패했거나 카테고리가 없습니다.</p>;
  }

  return <CategoryListClient initialCategories={categories} />;
};

export default CategoryListServer;
