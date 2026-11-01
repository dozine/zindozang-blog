import prisma from "@/lib/db/prisma";
import { toCategoryResponse } from "@/lib/serializers/responses";
import type { CategoryResponse } from "@/types/api/category";

export async function getAllCategories(): Promise<CategoryResponse[]> {
  try {
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
