import { z } from "zod";
import { postRecoverySchema } from "./postRecovery";
import { updatePostSchema, postSlugInputSchema } from "./post";

export const draftContentSchema = postRecoverySchema.shape.content;
export const saveDraftSchema = z
  .object({
    id: z.string().min(1).optional(),
    updatedAt: z.iso.datetime().nullable().optional(),
    content: draftContentSchema,
  })
  .refine((data) => !data.id || data.updatedAt !== undefined, "초안을 다시 불러와주세요.");
export const publishDraftSchema = updatePostSchema.extend({
  slug: postSlugInputSchema,
  updatedAt: z.iso.datetime().nullable(),
});
export const deleteDraftSchema = z.object({ updatedAt: z.iso.datetime().nullable() });
export const draftResponseSchema = z.object({
  id: z.string(),
  updatedAt: z.iso.datetime().nullable(),
  content: draftContentSchema,
});

export const draftListResponseSchema = z.array(draftResponseSchema);
export const draftIdSchema = z.object({ id: z.string().min(1) });
export const deleteDraftResponseSchema = z.object({ success: z.literal(true) });
