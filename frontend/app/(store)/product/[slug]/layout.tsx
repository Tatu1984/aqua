import { Metadata } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ProductMetadata {
  name: string;
  seoTitle?: string;
  seoDescription?: string;
  description?: string;
  images: { url: string }[];
  price: number;
  category?: { name: string };
}

async function getProductMetadata(slug: string): Promise<ProductMetadata | null> {
  try {
    const res = await fetch(`${API_URL}/api/products/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.product;
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
  const product = await getProductMetadata(slug);

  if (!product) {
    return {
      title: "Product Not Found | Aqua",
    };
  }

  const title = product.seoTitle || `${product.name} | Aqua`;
  const description =
    product.seoDescription ||
    product.description?.slice(0, 160) ||
    `Buy ${product.name} from Aqua - India's leading aquarium store`;
  const image = product.images[0]?.url || "/og-default.jpg";

  return {
    title,
    description,
    keywords: [
      product.name,
      product.category?.name || "Aquarium",
      "aquarium supplies",
      "fish",
      "plants",
      "India",
    ],
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 800, height: 800, alt: product.name }],
      type: "website",
      siteName: "Aqua",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    other: {
      "product:price:amount": product.price.toString(),
      "product:price:currency": "INR",
    },
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
