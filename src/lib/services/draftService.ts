import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  draftResponseSchema,
  draftListResponseSchema,
  deleteDraftResponseSchema,
} from "@/lib/zod/draft";
import type {
  DraftListResponse,
  DraftDetailResponse,
  SaveDraftRequest,
  SaveDraftResponse,
  PublishDraftRequest,
  PublishDraftResponse,
  DeleteDraftInput,
  DeleteDraftResponse,
} from "@/types/api/draft";
import { postResponseSchema } from "@/lib/zod/post";
import { parseApiResponse, readApiError } from "@/lib/zod/response";

async function checked(response: Response) {
  if (!response.ok) throw new Error(await readApiError(response, "초안 요청에 실패했습니다."));
  return response;
}
export async function listDrafts(): Promise<DraftListResponse> {
  return parseApiResponse(
    await checked(await fetch(API_ENDPOINTS.drafts.list, { cache: "no-store" })),
    draftListResponseSchema
  );
}
export async function loadDraft(id: string): Promise<DraftDetailResponse> {
  return parseApiResponse(
    await checked(await fetch(API_ENDPOINTS.drafts.detail(id), { cache: "no-store" })),
    draftResponseSchema
  );
}
export async function saveDraft(body: SaveDraftRequest): Promise<SaveDraftResponse> {
  return parseApiResponse(
    await checked(
      await fetch(API_ENDPOINTS.drafts.list, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    ),
    draftResponseSchema
  );
}
export async function publishDraft(
  id: string,
  body: PublishDraftRequest
): Promise<PublishDraftResponse> {
  return parseApiResponse(
    await checked(
      await fetch(API_ENDPOINTS.drafts.publish(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    ),
    postResponseSchema
  );
}

export async function deleteDraft(draft: DeleteDraftInput): Promise<DeleteDraftResponse> {
  return parseApiResponse(
    await checked(
      await fetch(API_ENDPOINTS.drafts.detail(draft.id), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updatedAt: draft.updatedAt }),
      })
    ),
    deleteDraftResponseSchema
  );
}
