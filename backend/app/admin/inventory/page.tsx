import Link from "next/link";
import Image from "next/image";
import { Warehouse, Package, AlertTriangle } from "lucide-react";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

async function getInventory() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      stockQuantity: true,
      stockStatus: true,
      lowStockThreshold: true,
      images: { take: 1, select: { url: true } },
      variants: {
        select: {
          id: true,
          sku: true,
          name: true,
          stockQuantity: true,
          stockStatus: true,
        },
      },
    },
    orderBy: [{ stockQuantity: "asc" }, { name: "asc" }],
  });

  const stats = {
    total: products.length,
    inStock: products.filter((p) => p.stockStatus === "IN_STOCK").length,
    lowStock: products.filter((p) => p.stockStatus === "LOW_STOCK").length,
    outOfStock: products.filter((p) => p.stockStatus === "OUT_OF_STOCK").length,
  };

  return { products, stats };
}

function getStockBadge(status: string, quantity: number) {
  if (status === "OUT_OF_STOCK" || quantity === 0) {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400">
        Out of Stock
      </span>
    );
  }
  if (status === "LOW_STOCK") {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400">
        Low Stock
      </span>
    );
  }
  return (
    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
      In Stock
    </span>
  );
}

export default async function InventoryPage() {
  const { products, stats } = await getInventory();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">
            Monitor and manage stock levels
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-[#00D4FF]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Products</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Warehouse className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inStock}</p>
              <p className="text-sm text-muted-foreground">In Stock</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.lowStock}</p>
              <p className="text-sm text-muted-foreground">Low Stock</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.outOfStock}</p>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-secondary/50">
              <tr className="text-left text-sm text-muted-foreground">
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">SKU</th>
                <th className="p-4 font-medium">Quantity</th>
                <th className="p-4 font-medium">Low Stock Threshold</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <Warehouse className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                          {product.images[0]?.url ? (
                            <Image
                              src={product.images[0].url}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium line-clamp-1">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm">{product.sku}</td>
                    <td className="p-4">
                      <span className={`font-medium ${product.stockQuantity <= (product.lowStockThreshold || 5) ? "text-red-400" : ""}`}>
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {product.lowStockThreshold || 5}
                    </td>
                    <td className="p-4">
                      {getStockBadge(product.stockStatus, product.stockQuantity)}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-sm text-[#00D4FF] hover:underline"
                      >
                        Update Stock
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
