import type { Prisma } from "@prisma/client";

// MongoDB documents created before status existed are published posts too.
export const publishedPostWhere: Prisma.PostWhereInput = {
  OR: [{ status: "PUBLISHED" }, { status: null }, { status: { isSet: false } }],
};
