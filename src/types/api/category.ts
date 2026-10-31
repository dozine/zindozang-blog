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

/** 외부에 제공하는 카테고리 필드. */
export interface CategoryResponse {
  id: string;
  slug: string;
  title: string;
  img: string | null;
}
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
