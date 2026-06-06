import { notFound } from "next/navigation";
import { getPostData } from "@/lib/data/post";
import SinglePageClient from "./singlePageClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPostData(slug as string);

  if (!data) {
    return {
      title: "포스트를 찾을 수 없습니다",
    };
  }

  return {
    title: data.title,
    description: data.desc ? data.desc.substring(0, 160).replace(/<[^>]*>/g, "") : "",
  };
}

const SinglePage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;

  const data = await getPostData(slug as string);

  if (!data) {
    notFound();
  }

  return <SinglePageClient data={data} slug={slug as string} />;
};

export default SinglePage;
