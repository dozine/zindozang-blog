import { z } from "zod";

// 앞뒤 공백 여부만 검사하고 원문은 그대로 보존한다.
export const requiredText = (message: string) =>
  z.string({ error: message }).refine((value) => value.trim().length > 0, { message });
