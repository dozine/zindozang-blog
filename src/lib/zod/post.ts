import { normalizePostSlug } from "@/lib/utils/slug";
import { DEFAULT_POST_FONT } from "@/lib/constants/post";
import { z } from "zod";
import { requiredText } from "./common";
import { tagResponseSchema } from "./tag";

export const postFontSchema = z.enum([
  "serif",
  "sans",
  "nanum",
  "nanum-myeongjo",
  "gowun-batang",
  "gowun-dodum",
  "system",
]);

/** 빈 값은 제목 기반 주소 생성을 뜻한다. */
export const postSlugInputSchema = z
  .string()
  .trim()
  .refine(
    (value) => !value || !!normalizePostSlug(value),
    "게시글 주소에 한글, 영문 또는 숫자를 포함해주세요."
  )
  .transform(normalizePostSlug)
  .optional();

const postFields = {
  title: requiredText("제목을 입력해주세요."),
  desc: requiredText("내용을 입력해주세요."),
  fontFamily: postFontSchema.optional(),
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
  slug: postSlugInputSchema,
});

export const postSlugSchema = z.object({
  slug: requiredText("Invalid post slug").refine(
    (slug) => slug !== "undefined",
    "Invalid post slug"
  ),
});

export const updatePostSchema = z.object(postFields);

export const postFieldsResponseSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  slug: z.string(),
  title: z.string(),
  desc: z.string(),
  fontFamily: postFontSchema.default(DEFAULT_POST_FONT),
  img: z.array(z.string()),
  views: z.number(),
  isPublished: z.boolean(),
  catSlug: z.string().nullable(),
});
export const postAuthorResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  image: z.string().nullable(),
});
export const postResponseSchema = postFieldsResponseSchema.extend({
  tags: z.array(tagResponseSchema),
  user: postAuthorResponseSchema,
});

export const postListResponseSchema = z.object({
  posts: z.array(postResponseSchema),
  count: z.number(),
});
export const deletePostResponseSchema = z.object({ message: z.string() });
