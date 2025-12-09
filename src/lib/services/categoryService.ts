import { Category } from "@prisma/client";

interface CategoryResult {
  success: boolean;
  error?: string;
  category?: { id: string; title: string; slug: string };
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch("/api/categories", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("카테고리를 불러올 수 없습니다.");
    }
    return await res.json();
  } catch (error: any) {
    console.error("API 카테고리 목록 조회 오류:", error);
    throw new Error(error.message || "서버 통신 중 오류가 발생했습니다.");
  }
}

export async function addCategory(title: string): Promise<CategoryResult> {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!title || !slug) {
    return { success: false, error: "카테고리 이름을 입력해주세요." };
  }

  try {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `카테고리 추가 실패 (${res.status})`,
      };
    }
    const category = await res.json();
    return { success: true, category };
  } catch (error: any) {
    console.error("API 카테고리 추가 오류:", error);
    return {
      success: false,
      error: error.message || "서버 통신 중 오류가 발생했습니다.",
    };
  }
}

export async function deleteCategory(categoryId: string): Promise<CategoryResult> {
  try {
    const res = await fetch(`/api/categories?id=${categoryId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `카테고리 삭제 실패 (${res.status})`,
      };
    }

    // 삭제 성공 시 body가 비어있을 수 있으므로 JSON 파싱 생략
    return { success: true };
  } catch (error: any) {
    console.error("API 카테고리 삭제 오류:", error);
    return {
      success: false,
      error: error.message || "서버 통신 중 오류가 발생했습니다.",
    };
  }
}
