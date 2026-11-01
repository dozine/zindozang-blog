/** @jest-environment node */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/services/authService";
import { requireAdmin } from "@/lib/services/requireAdmin";
import { POST as createPost } from "@/app/api/posts/route";
import { PUT as updatePost } from "@/app/api/posts/[slug]/route";
import { POST as createCategory } from "@/app/api/categories/route";
import { POST as createTag } from "@/app/api/tags/route";
import {
  createCategorySchema,
  createPostSchema,
  createTagSchema,
  updatePostSchema,
} from "@/lib/validation/schemas";

jest.mock("@/lib/services/authService", () => ({ getAuthSession: jest.fn() }));
jest.mock("@/lib/services/requireAdmin", () => ({ requireAdmin: jest.fn() }));
jest.mock("@/lib/db/prisma", () => ({
  __esModule: true,
  default: {
    post: { findUnique: jest.fn() },
    category: { findUnique: jest.fn(), create: jest.fn() },
    tag: { findUnique: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const db = prisma as unknown as {
  post: { findUnique: jest.Mock };
  category: { findUnique: jest.Mock; create: jest.Mock };
  tag: { findUnique: jest.Mock; create: jest.Mock };
  $transaction: jest.Mock;
};
const params = () => ({ params: Promise.resolve({ slug: "hello" }) });
const request = (method: string, body: string) =>
  new NextRequest("http://localhost/api/test", {
    method,
    headers: { "Content-Type": "application/json" },
    body,
  });
const validPost = { slug: "hello", title: "제목", desc: "내용" };

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(getAuthSession).mockResolvedValue({
    user: { email: "admin@example.test" },
    expires: "2099-01-01",
  });
  jest.mocked(requireAdmin).mockResolvedValue(null);
});

const invalidCases: [string, () => Promise<Response>][] = [
  [
    "post with empty title",
    () => createPost(request("POST", JSON.stringify({ ...validPost, title: "  " }))),
  ],
  [
    "post without content",
    () => createPost(request("POST", JSON.stringify({ slug: "hello", title: "제목" }))),
  ],
  [
    "post with wrong image type",
    () => createPost(request("POST", JSON.stringify({ ...validPost, img: [1] }))),
  ],
  [
    "post with wrong publication type",
    () => createPost(request("POST", JSON.stringify({ ...validPost, isPublished: "false" }))),
  ],
  [
    "post with invalid tag IDs",
    () => createPost(request("POST", JSON.stringify({ ...validPost, tags: [" "] }))),
  ],
  [
    "post update with non-string content",
    () => updatePost(request("PUT", JSON.stringify({ title: "제목", desc: 42 })), params()),
  ],
  [
    "category with numeric title",
    () => createCategory(request("POST", JSON.stringify({ title: 42, slug: "notes" }))),
  ],
  [
    "category with invalid image",
    () =>
      createCategory(request("POST", JSON.stringify({ title: "Notes", slug: "notes", img: {} }))),
  ],
  ["tag with empty name", () => createTag(request("POST", JSON.stringify({ name: " " })))],
  ["tag with null body", () => createTag(request("POST", "null"))],
];

test.each(invalidCases)("rejects %s before database access", async (_name, run) => {
  const response = await run();
  expect(response.status).toBe(400);
  expect((await response.json()).message).toEqual(expect.any(String));
  expect(db.$transaction).not.toHaveBeenCalled();
  expect(db.post.findUnique).not.toHaveBeenCalled();
  expect(db.category.findUnique).not.toHaveBeenCalled();
  expect(db.category.create).not.toHaveBeenCalled();
  expect(db.tag.findUnique).not.toHaveBeenCalled();
  expect(db.tag.create).not.toHaveBeenCalled();
});

test.each([
  ["post creation", () => createPost(request("POST", "{"))],
  ["post update", () => updatePost(request("PUT", "{"), params())],
  ["category creation", () => createCategory(request("POST", "{"))],
  ["tag creation", () => createTag(request("POST", "{"))],
])("returns 400 for malformed JSON in %s", async (_name, run) => {
  const response = await run();
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ message: "유효한 JSON을 입력해주세요." });
  expect(db.$transaction).not.toHaveBeenCalled();
  expect(db.post.findUnique).not.toHaveBeenCalled();
  expect(db.category.findUnique).not.toHaveBeenCalled();
  expect(db.tag.findUnique).not.toHaveBeenCalled();
});

test("authentication is checked before parsing invalid requests", async () => {
  jest.mocked(getAuthSession).mockResolvedValue(null);
  jest
    .mocked(requireAdmin)
    .mockResolvedValue(NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 }));
  expect((await createPost(request("POST", "{"))).status).toBe(401);
  expect((await updatePost(request("PUT", "{"), params())).status).toBe(401);
  expect((await createCategory(request("POST", "{"))).status).toBe(401);
  expect((await createTag(request("POST", "{"))).status).toBe(401);
});

test("accepts existing valid request formats without changing their values", () => {
  const post = { ...validPost, img: null, tags: ["tag-1"], isPublished: false };
  expect(createPostSchema.parse(post)).toEqual(post);
  expect(createPostSchema.parse({ ...validPost, img: ["image-url"] }).img).toEqual(["image-url"]);
  expect(updatePostSchema.parse({ title: " 제목 ", desc: " 내용 " })).toEqual({
    title: " 제목 ",
    desc: " 내용 ",
  });
  expect(createCategorySchema.parse({ title: "Notes", slug: "notes", img: null }).img).toBeNull();
  expect(createTagSchema.parse({ name: "React" })).toEqual({ name: "React" });
});
