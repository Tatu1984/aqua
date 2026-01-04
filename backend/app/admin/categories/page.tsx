import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Trash2, FolderTree } from "lucide-react";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

async function getCategories() {
  const categories = await prisma.category.findMany({
    include: {
      parent: { select: { name: true } },
      children: { select: { id: true } },
      _count: { select: { products: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return categories;
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage product categories ({categories.length} categories)
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D4FF] text-[#0A1628] font-medium rounded-lg hover:bg-[#00D4FF]/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Link>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length === 0 ? (
          <div className="col-span-full p-12 text-center text-muted-foreground bg-card border border-border rounded-lg">
            <FolderTree className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No categories found</p>
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="bg-card border border-border rounded-lg overflow-hidden hover:border-[#00D4FF]/50 transition-colors"
            >
              <div className="relative h-32 bg-secondary">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
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
                    <p className="text-sm text-muted-foreground">
                      {category.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/categories/${category.id}`}
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
                </div>

                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{category._count.products} products</span>
                  <span>{category.children.length} subcategories</span>
                </div>

                {category.parent && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Parent: {category.parent.name}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
