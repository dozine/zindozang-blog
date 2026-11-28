import { postFontSchema } from "@/lib/zod/post";
import { DEFAULT_POST_FONT } from "@/lib/constants/post";
import type { PostFont } from "@/types/post";

export function normalizePostFont(value: unknown): PostFont {
  const result = postFontSchema.safeParse(value);
  return result.success ? result.data : DEFAULT_POST_FONT;
}
