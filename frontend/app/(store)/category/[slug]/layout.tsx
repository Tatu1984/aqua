import { Metadata } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface CategoryMetadata {
  name: string;
  seoTitle?: string;
  seoDescription?: string;
  description?: string;
  image?: string;
}

async function getCategoryMetadata(slug: string): Promise<CategoryMetadata | null> {
  try {
    const res = await fetch(`${API_URL}/api/categories/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.category;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryMetadata(slug);

  if (!category) {
    return {
      title: "Category Not Found | Aqua",
    };
  }

  const title = category.seoTitle || `${category.name} | Aqua`;
  const description =
    category.seoDescription ||
    category.description?.slice(0, 160) ||
    `Shop ${category.name} at Aqua - India's leading aquarium store`;
  const image = category.image || "/og-default.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: category.name }],
      type: "website",
      siteName: "Aqua",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
