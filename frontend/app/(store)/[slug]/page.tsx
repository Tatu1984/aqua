import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPage } from "@/lib/api";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { page } = await getPage(slug);
    return {
      title: page.seoTitle || page.title,
      description: page.seoDescription || undefined,
    };
  } catch {
    return { title: "Page Not Found" };
  }
}

export default async function CMSPage({ params }: PageProps) {
  const { slug } = await params;

  let page;
  try {
    const data = await getPage(slug);
    page = data.page;
  } catch {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <article className="prose prose-neutral dark:prose-invert max-w-3xl mx-auto">
        {page.content ? (
          <div dangerouslySetInnerHTML={{ __html: page.content }} />
        ) : (
          <div>
            <h1>{page.title}</h1>
            <p>This page has no content yet.</p>
          </div>
        )}
      </article>
    </div>
  );
}
