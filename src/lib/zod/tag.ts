import { z } from "zod";
import { requiredText } from "./common";

export const createTagSchema = z.object({
  name: requiredText("태그 이름을 입력해주세요."),
});

export const tagByIdSchema = z.object({
  id: requiredText("유효하지 않은 태그 ID입니다.").refine(
    (id) => id !== "undefined",
    "유효하지 않은 태그 ID입니다."
  ),
});

export const tagResponseSchema = z.object({ id: z.string(), name: z.string() });
export const tagWithPostCountResponseSchema = tagResponseSchema.extend({
  _count: z.object({ posts: z.number() }),
});
export const tagListResponseSchema = z.array(tagWithPostCountResponseSchema);

export const deleteTagResponseSchema = z.object({ message: z.string() });
export const tagErrorResponseSchema = z.object({ message: z.string() });
export const duplicateTagResponseSchema = z.union([tagResponseSchema, tagErrorResponseSchema]);
