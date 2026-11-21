import { z } from "zod";
import { parseJson } from "./parse";

const errorResponseSchema = z.object({ message: z.string() });

export async function readApiError(response: Response, fallback: string): Promise<string> {
  const result = await parseJson(response, errorResponseSchema);
  return result.success ? result.data.message : fallback;
}

export async function parseApiResponse<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  const result = await parseJson(response, schema);
  if (result.success) return result.data;

  throw new Error(
    result.reason === "invalid_json"
      ? "서버 응답을 읽을 수 없습니다."
      : "서버 응답 형식이 올바르지 않습니다."
  );
}
