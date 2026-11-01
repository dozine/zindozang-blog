import type { CategoryData } from "@/types/category";
import { getAllCategories } from "@/lib/data/category";
import CategoryListClient from "./CategoryListClient";

const CategoryListServer = async () => {
  const categories: CategoryData[] = await getAllCategories();

  return <CategoryListClient initialCategories={categories} />;
};

export default CategoryListServer;
