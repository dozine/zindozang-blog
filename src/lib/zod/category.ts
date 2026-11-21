import { z } from "zod";
import { requiredText } from "./common";

export const createCategorySchema = z.object({
  slug: requiredText("카테고리 주소를 입력해주세요."),
  title: requiredText("카테고리 이름을 입력해주세요."),
  img: z.string({ error: "이미지 형식을 확인해주세요." }).nullable().optional(),
});

export const deleteCategorySchema = z.object({
  id: requiredText("카테고리 id가 없습니다."),
});

export const categoryResponseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  img: z.string().nullable(),
});
export const categoryListResponseSchema = z.array(categoryResponseSchema);
export const createCategoryResponseSchema = z.object({
  message: z.string(),
  category: categoryResponseSchema,
});

export const deleteCategoryResponseSchema = z.object({
  message: z.string(),
  deleted: categoryResponseSchema,
});
