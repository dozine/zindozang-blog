import type { CategoryData } from "@/types/category";

/** POST /api/categories 요청 본문. */
export interface CreateCategoryRequest {
  slug: string;
  title: string;
  img?: string | null;
}

/** DELETE /api/categories의 쿼리 파라미터. */
export interface DeleteCategoryRequest {
  id: string;
}

/** 카테고리는 현재 JSON 직렬화 시 변환되는 날짜 필드가 없다. */
export type CategoryResponse = CategoryData;
export type CategoryListResponse = CategoryResponse[];

export interface CreateCategoryResponse {
  message: string;
  category: CategoryResponse;
}

/** DELETE /api/categories?id=... 성공 응답. */
export interface DeleteCategoryResponse {
  message: string;
  deleted: CategoryResponse;
}
