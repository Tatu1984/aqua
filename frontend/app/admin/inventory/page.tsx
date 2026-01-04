"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Warehouse, Package, AlertTriangle } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  stockStatus: string;
  lowStockThreshold: number | null;
  images: { url: string }[];
}

interface Stats {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

function getStockBadge(status: string, quantity: number) {
  if (status === "OUT_OF_STOCK" || quantity === 0) {
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400">Out of Stock</span>;
  }
  if (status === "LOW_STOCK") {
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400">Low Stock</span>;
  }
  return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">In Stock</span>;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, inStock: 0, lowStock: 0, outOfStock: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/admin/inventory");
      const data = await res.json();
      setProducts(data.products || []);
      setStats(data.stats || { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 });
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Monitor and manage stock levels</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[#00D4FF]/20 flex items-center justify-center"><Package className="h-5 w-5 text-[#00D4FF]" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total Products</p></div></div></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center"><Warehouse className="h-5 w-5 text-green-400" /></div><div><p className="text-2xl font-bold">{stats.inStock}</p><p className="text-sm text-muted-foreground">In Stock</p></div></div></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-yellow-400" /></div><div><p className="text-2xl font-bold">{stats.lowStock}</p><p className="text-sm text-muted-foreground">Low Stock</p></div></div></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center"><Package className="h-5 w-5 text-red-400" /></div><div><p className="text-2xl font-bold">{stats.outOfStock}</p><p className="text-sm text-muted-foreground">Out of Stock</p></div></div></div>
      </div>

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
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground"><Warehouse className="h-12 w-12 mx-auto mb-3 opacity-50" />No products found</td></tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                          {product.images[0]?.url ? <Image src={product.images[0].url} alt={product.name} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>}
                        </div>
                        <span className="font-medium line-clamp-1">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm">{product.sku}</td>
                    <td className="p-4"><span className={`font-medium ${product.stockQuantity <= (product.lowStockThreshold || 5) ? "text-red-400" : ""}`}>{product.stockQuantity}</span></td>
                    <td className="p-4 text-sm text-muted-foreground">{product.lowStockThreshold || 5}</td>
                    <td className="p-4">{getStockBadge(product.stockStatus, product.stockQuantity)}</td>
                    <td className="p-4"><Link href={`/admin/products/${product.id}`} className="text-sm text-[#00D4FF] hover:underline">Update Stock</Link></td>
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
