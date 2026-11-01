/** @jest-environment node */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/services/authService";
import { requireAdmin } from "@/lib/services/requireAdmin";
import { GET as listPosts, POST as createPost } from "@/app/api/posts/route";
import {
  GET as readPost,
  PUT as updatePost,
  DELETE as deletePost,
} from "@/app/api/posts/[slug]/route";
import {
  GET as listCategories,
  POST as createCategory,
  DELETE as deleteCategory,
} from "@/app/api/categories/route";
import { GET as listTags, POST as createTag } from "@/app/api/tags/route";
import { GET as readTag, DELETE as deleteTag } from "@/app/api/tags/[id]/route";
import { GET as readVisitor, POST as trackVisitor } from "@/app/api/visitor/route";
import { getPostData, getPosts } from "@/lib/data/post";

jest.mock("@/lib/services/authService", () => ({ getAuthSession: jest.fn() }));
jest.mock("@/lib/services/requireAdmin", () => ({ requireAdmin: jest.fn() }));
jest.mock("@/lib/db/prisma", () => ({
  __esModule: true,
  default: {
    post: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    category: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), delete: jest.fn() },
    tag: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
    postTag: { create: jest.fn(), deleteMany: jest.fn() },
    visitor: { findUnique: jest.fn(), upsert: jest.fn() },
    siteStats: { findUnique: jest.fn(), upsert: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const db = prisma as unknown as {
  post: {
    findMany: jest.Mock;
    count: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
    delete: jest.Mock;
  };
  category: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; delete: jest.Mock };
  tag: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock; delete: jest.Mock };
  postTag: { create: jest.Mock; deleteMany: jest.Mock };
  visitor: { findUnique: jest.Mock; upsert: jest.Mock };
  siteStats: { findUnique: jest.Mock; upsert: jest.Mock };
  $transaction: jest.Mock;
};
const date = new Date("2026-01-02T03:04:05.000Z");
const author = {
  id: "user-1",
  email: "admin@example.test",
  name: "Admin",
  image: null,
  emailVerified: date,
  internal: "secret",
};
const tag = { id: "tag-1", name: "React", internal: "secret" };
const category = { id: "category-1", slug: "notes", title: "Notes", img: null, internal: "secret" };
const post = {
  id: "post-1",
  createdAt: date,
  slug: "hello",
  title: "Hello",
  desc: "Body",
  img: [],
  views: 1,
  isPublished: true,
  catSlug: "notes",
  userEmail: author.email,
  internal: "secret",
};
const relation = { id: "relation-1", postId: post.id, tagId: tag.id, tag };
const publicPostFields = {
  id: post.id,
  createdAt: date.toISOString(),
  slug: post.slug,
  title: post.title,
  desc: post.desc,
  img: [],
  views: 1,
  isPublished: true,
  catSlug: "notes",
};
const publicAuthor = { id: author.id, name: author.name, image: null };
const publicTag = { id: tag.id, name: tag.name };
const publicCategory = { id: category.id, slug: category.slug, title: category.title, img: null };
const fullPost = { ...post, user: author, tags: [relation] };
const slugParams = { params: Promise.resolve({ slug: post.slug }) };
const tagParams = { params: Promise.resolve({ id: tag.id }) };
const request = (method = "GET", body?: object) =>
  new NextRequest("http://localhost/api/test", {
    method,
    ...(body
      ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }
      : {}),
  });

beforeEach(() => {
  jest.resetAllMocks();
  jest
    .mocked(getAuthSession)
    .mockResolvedValue({ user: { email: author.email }, expires: "2099-01-01" });
  jest.mocked(requireAdmin).mockResolvedValue(null);
  db.$transaction.mockImplementation((arg) =>
    typeof arg === "function" ? arg(db) : Promise.all(arg)
  );
});

test("post list and detail serialize their declared fields and dates", async () => {
  db.post.findMany.mockResolvedValue([fullPost]);
  db.post.count.mockResolvedValue(1);
  const list = await listPosts(request());
  expect(await list.json()).toEqual({
    posts: [{ ...publicPostFields, tags: [publicTag], user: { ...publicAuthor, image: "" } }],
    count: 1,
  });
  db.post.findUnique.mockResolvedValue(fullPost);
  db.post.update.mockResolvedValue(fullPost);
  const detail = await readPost(request(), slugParams);
  expect(await detail.json()).toEqual({
    ...publicPostFields,
    tags: [publicTag],
    user: publicAuthor,
  });
});

test("post creation and update preserve their response shapes", async () => {
  db.post.create.mockResolvedValue(post);
  db.post.findUnique.mockResolvedValue(fullPost);
  const created = await createPost(
    request("POST", { title: post.title, desc: post.desc, slug: post.slug })
  );
  expect(created.status).toBe(200);
  expect(await created.json()).toEqual({
    ...publicPostFields,
    tags: [publicTag],
    user: publicAuthor,
  });
  db.post.update.mockResolvedValue(post);
  const updated = await updatePost(
    request("PUT", { title: post.title, desc: post.desc }),
    slugParams
  );
  expect(updated.status).toBe(200);
  expect(await updated.json()).toEqual({
    ...publicPostFields,
    tags: [publicTag],
    user: publicAuthor,
  });
});

test("category list and creation expose only the declared fields", async () => {
  db.category.findUnique.mockResolvedValueOnce(null);
  db.category.findMany.mockResolvedValue([category]);
  db.category.create.mockResolvedValue(category);
  expect(await (await listCategories()).json()).toEqual([publicCategory]);
  const result = await createCategory(request("POST", { slug: "notes", title: "Notes" }));
  expect(result.status).toBe(201);
  expect(await result.json()).toEqual({ message: "카테고리 생성 완료", category: publicCategory });
});

test("tag list, duplicate response and detail expose only declared fields", async () => {
  db.tag.findMany.mockResolvedValue([{ ...tag, _count: { posts: 1, internal: 3 } }]);
  expect(await (await listTags(request())).json()).toEqual([
    { ...publicTag, _count: { posts: 1 } },
  ]);
  db.tag.findUnique
    .mockResolvedValueOnce(tag)
    .mockResolvedValueOnce({ ...tag, posts: [{ ...relation, post }] });
  const duplicate = await createTag(request("POST", { name: "React" }));
  expect(duplicate.status).toBe(409);
  expect(await duplicate.json()).toEqual(publicTag);
  const detail = await readTag(request(), tagParams);
  expect(await detail.json()).toEqual({
    ...publicTag,
    posts: [{ id: relation.id, postId: post.id, tagId: tag.id, post: publicPostFields }],
  });
  expect(db.tag.findUnique.mock.calls[1][0].include.posts.where).toEqual({
    post: { isPublished: true },
  });
});

test("server post views keep Date values and exclude database-only fields", async () => {
  db.post.findMany.mockResolvedValue([fullPost]);
  db.post.count.mockResolvedValue(1);
  const list = await getPosts({ page: 1 });
  if (!list) throw new Error("Expected posts");
  expect(list.posts[0]).toEqual({
    ...publicPostFields,
    createdAt: date,
    tags: [publicTag],
    user: { ...publicAuthor, image: "" },
  });
  db.post.findUnique.mockResolvedValue({ isPublished: true, userEmail: author.email });
  db.post.update.mockResolvedValue(fullPost);
  expect(await getPostData(post.slug)).toEqual({
    ...publicPostFields,
    createdAt: date,
    tags: [publicTag],
    user: publicAuthor,
    isAuthor: true,
  });
});

test("category deletion returns the declared category shape", async () => {
  db.category.findUnique.mockResolvedValueOnce(category);
  db.category.delete.mockResolvedValue(category);
  const response = await deleteCategory(
    new NextRequest("http://localhost/api/categories?id=category-1", { method: "DELETE" })
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ message: "카테고리 삭제 완료", deleted: publicCategory });
  expect(db.post.updateMany).toHaveBeenCalledWith({
    where: { catSlug: category.slug },
    data: { catSlug: null },
  });
  expect(db.category.delete).toHaveBeenCalledWith({ where: { id: "category-1" } });
});

test("tag creation and deletion retain their response shapes", async () => {
  db.tag.findUnique.mockResolvedValue(null);
  db.tag.create.mockResolvedValue(tag);
  expect(await (await createTag(request("POST", { name: "React" }))).json()).toEqual(publicTag);
  expect(await (await deleteTag(request("DELETE"), tagParams)).json()).toEqual({
    message: "태그가 삭제되었습니다.",
  });
});

test("visitor GET and both tracking outcomes match their contracts", async () => {
  db.visitor.findUnique.mockResolvedValue({ count: 2 });
  db.siteStats.findUnique.mockResolvedValue({ totalVisitors: 10 });
  expect(await (await readVisitor()).json()).toEqual({ todayVisitors: 2, totalVisitors: 10 });
  const visitedRequest = new NextRequest("http://localhost/api/visitor", {
    method: "POST",
    headers: { cookie: "visited=true" },
  });
  expect(await (await trackVisitor(visitedRequest)).json()).toEqual({
    todayVisitors: 2,
    totalVisitors: 10,
    counted: false,
  });
  db.visitor.upsert.mockResolvedValue({ count: 3 });
  db.siteStats.upsert.mockResolvedValue({ totalVisitors: 11 });
  const firstVisit = await trackVisitor(request("POST"));
  expect(await firstVisit.json()).toEqual({ todayVisitors: 3, totalVisitors: 11, counted: true });
  expect(firstVisit.cookies.get("visited")?.value).toBe("true");
});

test("unauthenticated users cannot create categories or tags", async () => {
  jest
    .mocked(requireAdmin)
    .mockResolvedValue(NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 }));
  expect((await createCategory(request("POST", { slug: "notes", title: "Notes" }))).status).toBe(
    401
  );
  expect((await createTag(request("POST", { name: "React" }))).status).toBe(401);
  expect(db.category.create).not.toHaveBeenCalled();
  expect(db.tag.create).not.toHaveBeenCalled();
});

test("private post detail is denied without returning its contents", async () => {
  jest.mocked(getAuthSession).mockResolvedValue(null);
  db.post.findUnique.mockResolvedValue({ ...fullPost, isPublished: false });
  const response = await readPost(request(), slugParams);
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ message: "Unauthorized" });
  expect(db.post.update).not.toHaveBeenCalled();
});

test("anonymous and other users do not receive author privileges or private author data", async () => {
  db.post.findUnique.mockResolvedValue({ isPublished: true, userEmail: author.email });
  db.post.update.mockResolvedValue(fullPost);

  jest.mocked(getAuthSession).mockResolvedValue(null);
  const anonymousView = await getPostData(post.slug);
  if (!anonymousView) throw new Error("Expected public post");
  expect(anonymousView.isAuthor).toBe(false);
  expect(JSON.stringify(anonymousView)).not.toContain(author.email);
  expect(JSON.stringify(anonymousView)).not.toContain("emailVerified");

  jest.mocked(getAuthSession).mockResolvedValue({
    user: { email: "reader@example.test" },
    expires: "2099-01-01",
  });
  const otherView = await getPostData(post.slug);
  if (!otherView) throw new Error("Expected public post");
  expect(otherView.isAuthor).toBe(false);
  expect(JSON.stringify(otherView)).not.toContain(author.email);
});

test("anonymous API responses omit author emails and verification dates, including nested tag posts", async () => {
  jest.mocked(getAuthSession).mockResolvedValue(null);
  db.post.findMany.mockResolvedValue([fullPost]);
  db.post.count.mockResolvedValue(1);
  db.post.findUnique.mockResolvedValue(fullPost);
  db.post.update.mockResolvedValue(fullPost);
  db.tag.findUnique.mockResolvedValue({ ...tag, posts: [{ ...relation, post }] });

  for (const response of [
    await listPosts(request()),
    await readPost(request(), slugParams),
    await readTag(request(), tagParams),
  ]) {
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(JSON.stringify(json)).not.toContain(author.email);
    expect(JSON.stringify(json)).not.toContain("userEmail");
    expect(JSON.stringify(json)).not.toContain("emailVerified");
  }
});

test("post edits and deletes continue checking ownership on the server", async () => {
  db.post.findUnique.mockResolvedValue(post);
  jest.mocked(getAuthSession).mockResolvedValue({
    user: { email: "reader@example.test" },
    expires: "2099-01-01",
  });
  const edit = await updatePost(request("PUT", { title: post.title, desc: post.desc }), slugParams);
  const deletion = await deletePost(request("DELETE"), slugParams);
  expect(edit.status).toBe(403);
  expect(deletion.status).toBe(403);
  expect(db.$transaction).not.toHaveBeenCalled();

  jest.mocked(getAuthSession).mockResolvedValue(null);
  expect(
    (await updatePost(request("PUT", { title: post.title, desc: post.desc }), slugParams)).status
  ).toBe(401);
  expect((await deletePost(request("DELETE"), slugParams)).status).toBe(401);
});

test("missing admin configuration does not expose unpublished posts to anonymous visitors", async () => {
  const originalAdminEmail = process.env.MYEMAIL;
  try {
    delete process.env.MYEMAIL;
    jest.mocked(getAuthSession).mockResolvedValue(null);
    db.post.findMany.mockResolvedValue([]);
    db.post.count.mockResolvedValue(0);

    await getPosts({ page: 1 });

    expect(db.post.findMany.mock.calls[0][0].where.OR).toEqual([{ isPublished: true }]);
  } finally {
    if (originalAdminEmail === undefined) delete process.env.MYEMAIL;
    else process.env.MYEMAIL = originalAdminEmail;
  }
});

test("a session without an email cannot remove the public-post filter", async () => {
  jest.mocked(getAuthSession).mockResolvedValue({
    user: { name: "No email" },
    expires: "2099-01-01",
  });
  db.post.findMany.mockResolvedValue([]);
  db.post.count.mockResolvedValue(0);

  const response = await listPosts(request());

  expect(response.status).toBe(200);
  expect(db.post.findMany.mock.calls[0][0].where.isPublished).toBe(true);
});

test("visitor tracking retries a transaction conflict and counts the visit", async () => {
  db.$transaction.mockRejectedValueOnce({ code: "P2034" });
  db.visitor.upsert.mockResolvedValue({ count: 3 });
  db.siteStats.upsert.mockResolvedValue({ totalVisitors: 11 });

  const response = await trackVisitor(request("POST"));

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ todayVisitors: 3, totalVisitors: 11, counted: true });
  expect(db.$transaction).toHaveBeenCalledTimes(2);
});


test("전체 글 조회는 미분류 글을 포함하고 카테고리 필터는 해당 글만 조회한다", async () => {
  const postWithoutCategory = { ...fullPost, catSlug: null };
  db.post.findMany.mockResolvedValue([postWithoutCategory]);
  db.post.count.mockResolvedValue(1);

  const all = await getPosts({ page: 1 });
  expect(all?.posts[0].catSlug).toBeNull();
  expect(db.post.findMany.mock.calls[0][0].where.catSlug).toBeUndefined();

  await getPosts({ page: 1, cat: "notes" });
  expect(db.post.findMany.mock.calls[1][0].where.catSlug).toBe("notes");
});


test("카테고리 없이 글을 생성하고 응답에도 null을 반환한다", async () => {
  const noCategory = { ...post, catSlug: null };
  db.post.create.mockResolvedValue(noCategory);
  db.post.findUnique.mockResolvedValue({ ...fullPost, catSlug: null });
  const response = await createPost(request("POST", { title: post.title, desc: post.desc, slug: post.slug, catSlug: null }));
  expect(response.status).toBe(200);
  expect((await response.json()).catSlug).toBeNull();
  expect(db.post.create.mock.calls[0][0].data.cat).toBeUndefined();
});

test("글 수정 시 null은 카테고리를 해제하고 생략은 기존 분류를 유지한다", async () => {
  db.post.findUnique.mockResolvedValue(fullPost);
  db.post.update.mockResolvedValue(post);
  const response = await updatePost(request("PUT", { title: post.title, desc: post.desc, catSlug: null }), slugParams);
  expect(response.status).toBe(200);
  expect(db.post.update.mock.calls[0][0].data.cat).toEqual({ disconnect: true });

  await updatePost(request("PUT", { title: post.title, desc: post.desc }), slugParams);
  expect(db.post.update.mock.calls[1][0].data.cat).toBeUndefined();
});

test("글 수정 시 선택한 카테고리를 연결한다", async () => {
  db.post.findUnique.mockResolvedValue(fullPost);
  db.post.update.mockResolvedValue(post);
  const response = await updatePost(request("PUT", { title: post.title, desc: post.desc, catSlug: "life" }), slugParams);
  expect(response.status).toBe(200);
  expect(db.post.update.mock.calls[0][0].data.cat).toEqual({ connect: { slug: "life" } });
});

test("기존 미분류 slug도 일반 카테고리로 생성할 수 있다", async () => {
  const other = { ...category, slug: "uncategorized", title: "Other" };
  db.category.findUnique.mockResolvedValue(null);
  db.category.create.mockResolvedValue(other);

  const response = await createCategory(request("POST", { slug: other.slug, title: other.title }));

  expect(response.status).toBe(201);
  expect((await response.json()).category.slug).toBe(other.slug);
});
