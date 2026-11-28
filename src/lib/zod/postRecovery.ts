import { DEFAULT_POST_FONT } from "@/lib/constants/post";
import { postFontSchema } from "./post";
import { z } from "zod";
import { tagResponseSchema } from "./tag";

export const postRecoverySchema = z.object({
  version: z.literal(1),
  savedAt: z.string(),
  content: z.object({
    slugInput: z.string().default(""),
    fontFamily: postFontSchema.default(DEFAULT_POST_FONT),
    title: z.string(),
    value: z.string(),
    uploadedImages: z.array(z.string()),
    thumbnailImg: z.string(),
    catSlug: z.string(),
    tags: z.array(tagResponseSchema),
    isPublished: z.boolean(),
    tagInput: z.string(),
  }),
});
