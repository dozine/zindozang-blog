import { z } from "zod";
import { postFieldsResponseSchema } from "./post";
import { tagResponseSchema } from "./tag";

export const tagDetailResponseSchema = tagResponseSchema.extend({
  posts: z.array(
    z.object({
      id: z.string(),
      postId: z.string(),
      tagId: z.string(),
      post: postFieldsResponseSchema,
    })
  ),
});
