import prisma from "@/lib/db/prisma";
import { toCategoryResponse } from "@/lib/serializers/responses";
import type { Category } from "@prisma/client";
import type { CategoryResponse } from "@/types/api/category";

const ensureUncategorizedCategory = async (): Promise<Category> => {
  const uncategorized = await prisma.category.findUnique({
    where: { slug: "uncategorized" },
  });

  if (!uncategorized) {
    return await prisma.category.create({
      data: {
        slug: "uncategorized",
        title: "미분류",
        img: null,
      },
    });
  }

  return uncategorized;
};

export async function getAllCategories(): Promise<CategoryResponse[]> {
  try {
    await ensureUncategorizedCategory();

    const categories = await prisma.category.findMany({
      orderBy: {
        title: "asc",
      },
    });

    return categories.map(toCategoryResponse);
  } catch (error) {
    console.error("카테고리 데이터 가져오기 오류:", error);
    return [];
  }
}
