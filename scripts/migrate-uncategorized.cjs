// 기본 실행은 조회만 수행한다. 실제 변경은 --apply를 명시해야 한다.
const { MongoClient } = require("mongodb");

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--apply") || args.length > 1) {
    throw new Error("사용법: node scripts/migrate-uncategorized.cjs [--apply]");
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL 환경 변수가 필요합니다.");

  const client = new MongoClient(process.env.DATABASE_URL);
  try {
    await client.connect();
    const db = client.db();
    const posts = db.collection("Post");
    const categories = db.collection("Category");
    const slug = "uncategorized";
    const category = await categories.findOne({ slug });
    const postCount = await posts.countDocuments({ catSlug: slug });
    console.log(`대상 데이터베이스: ${db.databaseName}`);
    console.log(`분류 해제할 게시글: ${postCount}개`);
    console.log(`기본 카테고리: ${category ? `존재 (제목: ${category.title})` : "없음"}`);

    if (category && category.title !== "미분류") {
      throw new Error("uncategorized 카테고리의 제목이 예상과 다릅니다. 데이터를 확인하세요.");
    }
    if (!args.includes("--apply")) {
      console.log("미리보기 모드입니다. 데이터를 변경하지 않았습니다.");
      return;
    }

    const session = client.startSession();
    try {
      const result = await session.withTransaction(async () => {
        // 트랜잭션 안에서도 대상의 정체를 다시 확인한다.
        const current = await categories.findOne({ slug }, { session });
        if (current && current.title !== "미분류") {
          throw new Error("카테고리가 변경되었습니다. 작업을 중단합니다.");
        }
        const updated = await posts.updateMany({ catSlug: slug }, { $set: { catSlug: null } }, { session });
        const deleted = await categories.deleteOne({ slug, title: "미분류" }, { session });
        return { posts: updated.modifiedCount, categories: deleted.deletedCount };
      });
      console.log(`분류 해제: ${result.posts}개, 기본 카테고리 삭제: ${result.categories}개`);
    } finally {
      await session.endSession();
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("미분류 데이터 이전 실패:", error.message);
  process.exitCode = 1;
});
