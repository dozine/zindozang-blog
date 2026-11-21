/** @jest-environment node */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/services/authService";
import { requireAdmin } from "@/lib/services/requireAdmin";
import { POST as createPost } from "@/app/api/posts/route";
import {
  GET as getPost,
  PUT as updatePost,
  DELETE as deletePost,
} from "@/app/api/posts/[slug]/route";
import { GET as getTag, DELETE as deleteTag } from "@/app/api/tags/[id]/route";
import { POST as createCategory, DELETE as deleteCategory } from "@/app/api/categories/route";
import { POST as createTag } from "@/app/api/tags/route";
import { createCategorySchema } from "@/lib/zod/category";
import { createPostSchema, updatePostSchema } from "@/lib/zod/post";
import { createTagSchema } from "@/lib/zod/tag";

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

test.each(["", "?id=", "?id=%20%20"])(
  "rejects a missing or blank category id (%s) before database access",
  async (query) => {
    const response = await deleteCategory(
      new NextRequest(`http://localhost/api/categories${query}`, { method: "DELETE" })
    );
    expect(response.status).toBe(400);
    expect(await response.text()).toBe("카테고리 id가 없습니다.");
    expect(db.category.findUnique).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  }
);

test("checks authorization before validating the category id", async () => {
  jest
    .mocked(requireAdmin)
    .mockResolvedValue(NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 }));
  const response = await deleteCategory(
    new NextRequest("http://localhost/api/categories", { method: "DELETE" })
  );
  expect(response.status).toBe(401);
  expect(db.category.findUnique).not.toHaveBeenCalled();
});

test("passes a valid category id to the database lookup", async () => {
  jest.mocked(db.category.findUnique).mockResolvedValue(null);
  const response = await deleteCategory(
    new NextRequest("http://localhost/api/categories?id=category-1", { method: "DELETE" })
  );
  expect(response.status).toBe(404);
  expect(db.category.findUnique).toHaveBeenCalledWith({ where: { id: "category-1" } });
});

test.each(["", "   ", "undefined"])(
  "rejects invalid post slug before database access: %s",
  async (slug) => {
    const routeParams = { params: Promise.resolve({ slug }) };
    expect(
      (await getPost(new NextRequest("http://localhost/api/posts/test"), routeParams)).status
    ).toBe(400);
    expect((await updatePost(request("PUT", JSON.stringify(validPost)), routeParams)).status).toBe(
      400
    );
    expect((await deletePost(request("DELETE", ""), routeParams)).status).toBe(400);
    expect(db.post.findUnique).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  }
);

test.each(["", "   ", "undefined"])(
  "rejects invalid tag id before database access: %s",
  async (id) => {
    const routeParams = { params: Promise.resolve({ id }) };
    expect(
      (await getTag(new NextRequest("http://localhost/api/tags/test"), routeParams)).status
    ).toBe(400);
    expect((await deleteTag(request("DELETE", ""), routeParams)).status).toBe(400);
    expect(db.tag.findUnique).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  }
);

test("checks authorization before validating post and tag deletion parameters", async () => {
  jest.mocked(getAuthSession).mockResolvedValue(null);
  jest
    .mocked(requireAdmin)
    .mockResolvedValue(NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 }));
  expect(
    (await deletePost(request("DELETE", ""), { params: Promise.resolve({ slug: "" }) })).status
  ).toBe(401);
  expect(
    (await deleteTag(request("DELETE", ""), { params: Promise.resolve({ id: "" }) })).status
  ).toBe(401);
  expect(db.$transaction).not.toHaveBeenCalled();
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
