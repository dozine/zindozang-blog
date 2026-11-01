import { z } from "zod";
import type { CreatePostRequest, UpdatePostRequest } from "@/types/api/post";
import type { CreateCategoryRequest } from "@/types/api/category";
import type { CreateTagRequest } from "@/types/api/tag";

// 앞뒤 공백 여부만 검사하고 원문은 그대로 보존한다.
const requiredText = (message: string) =>
  z
    .string({ error: message })
    .refine((value) => value.trim().length > 0, { message });

const postFields = {
  title: requiredText("제목을 입력해주세요."),
  desc: requiredText("내용을 입력해주세요."),
  img: z
    .union([z.string(), z.array(z.string()), z.null()], {
      error: "이미지 형식을 확인해주세요.",
    })
    .optional(),
  catSlug: requiredText("카테고리 주소를 확인해주세요.").nullable().optional(),
  isPublished: z.boolean({ error: "공개 설정을 확인해주세요." }).optional(),
  tags: z
    .array(requiredText("유효한 태그 ID가 필요합니다."), {
      error: "태그 목록을 확인해주세요.",
    })
    .optional(),
};

export const createPostSchema = z.object({
  ...postFields,
  slug: requiredText("게시글 주소를 입력해주세요."),
}) satisfies z.ZodType<CreatePostRequest>;

export const updatePostSchema = z.object(
  postFields,
) satisfies z.ZodType<UpdatePostRequest>;

export const createCategorySchema = z.object({
  slug: requiredText("카테고리 주소를 입력해주세요."),
  title: requiredText("카테고리 이름을 입력해주세요."),
  img: z.string({ error: "이미지 형식을 확인해주세요." }).nullable().optional(),
}) satisfies z.ZodType<CreateCategoryRequest>;

export const createTagSchema = z.object({
  name: requiredText("태그 이름을 입력해주세요."),
}) satisfies z.ZodType<CreateTagRequest>;
