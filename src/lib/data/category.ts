import prisma from "@/lib/db/prisma";
import { Category } from "@prisma/client";

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

export async function getAllCategories(): Promise<Category[]> {
  try {
    await ensureUncategorizedCategory();

    const categories = await prisma.category.findMany({
      orderBy: {
        title: "asc",
      },
    });

    return categories;
  } catch (error) {
    console.error("카테고리 데이터 가져오기 오류:", error);
    return [];
  }
}
