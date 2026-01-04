"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  stockStatus: string;
  category: { name: string } | null;
  images: { url: string }[];
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);
}

function getStockBadge(status: string) {
  switch (status) {
    case "IN_STOCK":
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">In Stock</span>;
    case "LOW_STOCK":
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400">Low Stock</span>;
    case "OUT_OF_STOCK":
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400">Out of Stock</span>;
    default:
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400">{status}</span>;
  }
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchValue = formData.get("search") as string;
    router.push(`/admin/products${searchValue ? `?search=${searchValue}` : ""}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your product inventory ({total} products)
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D4FF] text-[#0A1628] font-medium rounded-lg hover:bg-[#00D4FF]/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="bg-card border border-border rounded-lg p-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search products..."
            className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
          />
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF] mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/50">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Price</th>
                  <th className="p-4 font-medium">Stock</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                            {product.images[0]?.url ? (
                              <Image
                                src={product.images[0].url}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{product.category?.name || "-"}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{formatPrice(product.price)}</p>
                          {product.compareAtPrice && (
                            <p className="text-sm text-muted-foreground line-through">
                              {formatPrice(product.compareAtPrice)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm">{product.stockQuantity}</td>
                      <td className="p-4">{getStockBadge(product.stockStatus)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="p-2 rounded-lg hover:bg-secondary transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            className="p-2 rounded-lg hover:bg-destructive/20 text-destructive transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            <Link
              href={`/admin/products?page=${Math.max(1, page - 1)}${search ? `&search=${search}` : ""}`}
              className={`px-4 py-2 text-sm rounded-lg border border-border hover:bg-secondary transition-colors ${page === 1 ? "pointer-events-none opacity-50" : ""}`}
            >
              Previous
            </Link>
            <span className="text-sm text-muted-foreground px-4">
              Page {page} of {totalPages}
            </span>
            <Link
              href={`/admin/products?page=${Math.min(totalPages, page + 1)}${search ? `&search=${search}` : ""}`}
              className={`px-4 py-2 text-sm rounded-lg border border-border hover:bg-secondary transition-colors ${page === totalPages ? "pointer-events-none opacity-50" : ""}`}
            >
              Next
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
