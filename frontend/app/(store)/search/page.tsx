"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { ProductCard } from "@/components/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  category?: string;
  stockStatus: string;
  isLivestock: boolean;
  isFeatured: boolean;
}

interface Facets {
  categories: { name: string; slug: string; count: number }[];
  priceRange: { min: number; max: number };
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    inStock: searchParams.get("inStock") === "true",
    sort: searchParams.get("sort") || "relevance",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filters.category) params.set("category", filters.category);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.inStock) params.set("inStock", "true");
      if (filters.sort) params.set("sort", filters.sort);
      params.set("page", String(pagination.page));

      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();

      setProducts(data.products || []);
      setFacets(data.facets);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, [query, filters, pagination.page]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    router.push(`/search?${params}`);
    fetchResults();
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      minPrice: "",
      maxPrice: "",
      inStock: false,
      sort: "relevance",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for fish, plants, equipment..."
            className="pl-12 pr-4 py-6 text-lg"
          />
          <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
            Search
          </Button>
        </div>
      </form>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <aside
          className={`${
            showFilters ? "fixed inset-0 z-50 bg-background p-6" : "hidden"
          } lg:block lg:relative lg:w-64 lg:flex-shrink-0`}
        >
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button onClick={() => setShowFilters(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Categories */}
            {facets?.categories && facets.categories.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Categories</h3>
                <div className="space-y-2">
                  {facets.categories.map((cat) => (
                    <label key={cat.slug} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === cat.slug}
                        onChange={() =>
                          setFilters({ ...filters, category: cat.slug })
                        }
                        className="rounded"
                      />
                      <span>
                        {cat.name} ({cat.count})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            <div>
              <h3 className="font-medium mb-3">Price Range</h3>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) =>
                    setFilters({ ...filters, minPrice: e.target.value })
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) =>
                    setFilters({ ...filters, maxPrice: e.target.value })
                  }
                />
              </div>
            </div>

            {/* In Stock */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) =>
                    setFilters({ ...filters, inStock: e.target.checked })
                  }
                  className="rounded"
                />
                <span>In Stock Only</span>
              </label>
            </div>

            {/* Clear Filters */}
            <Button variant="outline" onClick={clearFilters} className="w-full">
              Clear Filters
            </Button>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              {pagination.total} results{query && ` for "${query}"`}
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>

              <select
                value={filters.sort}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-muted rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    ...product,
                    image: product.image || "https://picsum.photos/400",
                    stockStatus: product.stockStatus as "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK",
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found.</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setPagination({ ...pagination, page })}
                    className={`px-4 py-2 rounded-lg ${
                      page === pagination.page
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
