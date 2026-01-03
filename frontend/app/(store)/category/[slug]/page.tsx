import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product";
import { SortSelect } from "@/components/sort-select";
import { getCategory, getProducts } from "@/lib/api";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const { page = "1", sort = "newest" } = await searchParams;

  try {
    const [categoryData, productsData] = await Promise.all([
      getCategory(slug),
      getProducts({
        category: slug,
        page: parseInt(page),
        limit: 12,
        sort,
      }),
    ]);

    const { category } = categoryData;
    const { products, pagination } = productsData;

    return (
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          {category.parent && (
            <>
              <Link
                href={`/category/${category.parent.slug}`}
                className="hover:text-primary"
              >
                {category.parent.name}
              </Link>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
          <span className="text-foreground">{category.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground">{category.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {pagination.total} products
          </p>
        </div>

        {/* Subcategories */}
        {category.children.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/category/${child.slug}`}
                className="px-4 py-2 bg-secondary rounded-lg text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}

        {/* Sort */}
        <div className="flex justify-between items-center mb-6">
          <div />
          <SortSelect defaultValue={sort} />
        </div>

        {/* Products */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  compareAtPrice: product.compareAtPrice,
                  image: product.image || "https://via.placeholder.com/400",
                  category: product.category,
                  stockStatus: product.stockStatus as "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK",
                  isLivestock: product.isLivestock,
                  livestockData: product.livestockData,
                  isFeatured: product.isFeatured,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found in this category.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <Link
                  key={pageNum}
                  href={`/category/${slug}?page=${pageNum}&sort=${sort}`}
                  className={`px-4 py-2 rounded-lg ${
                    pageNum === pagination.page
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  {pageNum}
                </Link>
              )
            )}
          </div>
        )}
      </div>
    );
  } catch (error) {
    notFound();
  }
}
