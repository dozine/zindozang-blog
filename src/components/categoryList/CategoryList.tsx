import type { CategoryData } from "@/types/category";
import { getAllCategories } from "@/lib/data/category";
import CategoryListClient from "./CategoryListClient";

const CategoryListServer = async () => {
  const categories: CategoryData[] = await getAllCategories();

  if (!categories || categories.length === 0) {
    return <p>카테고리를 불러오는 데 실패했거나 카테고리가 없습니다.</p>;
  }

  return <CategoryListClient initialCategories={categories} />;
};

export default CategoryListServer;
