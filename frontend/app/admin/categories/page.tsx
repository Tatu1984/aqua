"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Trash2, FolderTree } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  parent: { name: string } | null;
  children: { id: string }[];
  _count: { products: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(data.categories || data || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage product categories ({categories.length} categories)</p>
        </div>
        <Link href="/admin/categories/new" className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D4FF] text-[#0A1628] font-medium rounded-lg hover:bg-[#00D4FF]/90 transition-colors">
          <Plus className="h-4 w-4" />
          Add Category
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length === 0 ? (
          <div className="col-span-full p-12 text-center text-muted-foreground bg-card border border-border rounded-lg">
            <FolderTree className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No categories found</p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="bg-card border border-border rounded-lg overflow-hidden hover:border-[#00D4FF]/50 transition-colors">
              <div className="relative h-32 bg-secondary">
                {category.image ? (
                  <Image src={category.image} alt={category.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FolderTree className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.slug}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/categories/${category.id}`} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button className="p-2 rounded-lg hover:bg-destructive/20 text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{category._count?.products || 0} products</span>
                  <span>{category.children?.length || 0} subcategories</span>
                </div>
                {category.parent && <p className="mt-2 text-xs text-muted-foreground">Parent: {category.parent.name}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
