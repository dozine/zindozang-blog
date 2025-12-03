export async function deletePost(slug: string): Promise<void> {
  if (!slug) throw new Error("Slug is required for deletion.");

  const res = await fetch(`/api/posts/${slug}`, {
    method: "DELETE",
    cache: "no-store",
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to delete post");
  }
}
