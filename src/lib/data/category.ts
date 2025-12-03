import { Category } from "@prisma/client";

export async function getAllCategories(): Promise<Category[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    console.error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다.");
    return [];
  }
  try {
    const res = await fetch(`${baseUrl}/api/categories`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.error("Failed to fetch categories:", res.status, res.statusText);
      throw new Error("카테고리를 불러오는데 실패했습니다.");
    }
    return (await res.json()) as Category[];
  } catch (error) {
    console.error("카테고리 데이터 가져오기 오류:", error);
    return [];
  }
}
