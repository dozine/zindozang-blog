import type { z } from "zod";
import type {
  createCategorySchema,
  deleteCategorySchema,
  categoryResponseSchema,
  categoryListResponseSchema,
  createCategoryResponseSchema,
  deleteCategoryResponseSchema,
} from "@/lib/zod/category";

/** POST /api/categories 요청 본문. */
export type CreateCategoryRequest = z.infer<typeof createCategorySchema>;

/** DELETE /api/categories의 쿼리 파라미터. */
export type DeleteCategoryRequest = z.infer<typeof deleteCategorySchema>;

/** 외부에 제공하는 카테고리 필드. */
export type CategoryResponse = z.infer<typeof categoryResponseSchema>;
export type CategoryListResponse = z.infer<typeof categoryListResponseSchema>;
export type CreateCategoryResponse = z.infer<typeof createCategoryResponseSchema>;

/** DELETE /api/categories?id=... 성공 응답. */
export type DeleteCategoryResponse = z.infer<typeof deleteCategoryResponseSchema>;
