import React from "react";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getPostData } from "@/lib/data/post";

const SinglePageClient = dynamic(() => import("./singlePageClient"), {
  loading: () => <p>로딩 중...</p>,
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPostData(slug as string);

  if (!data) {
    return {
      title: "포스트를 찾을 수 없습니다",
    };
  }

  return {
    title: data.title,
    description: data.desc
      ? data.desc.substring(0, 160).replace(/<[^>]*>/g, "")
      : "",
  };
}

const SinglePage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  const data = await getPostData(slug as string);

  if (!data) {
    notFound();
  }

  return <SinglePageClient data={data} slug={slug as string} />;
};

export default SinglePage;
