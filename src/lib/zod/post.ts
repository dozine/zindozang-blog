import { z } from "zod";
import { requiredText } from "./common";
import { tagResponseSchema } from "./tag";

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
