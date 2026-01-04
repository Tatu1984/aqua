import Link from "next/link";
import { Plus, Edit, Trash2, FileText, Eye, Globe } from "lucide-react";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

async function getPages() {
  const pages = await prisma.page.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return pages;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function getStatusBadge(status: string) {
  if (status === "PUBLISHED") {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
        Published
      </span>
    );
  }
  return (
    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400">
      Draft
    </span>
  );
}

export default async function PagesPage() {
  const pages = await getPages();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pages</h1>
          <p className="text-muted-foreground">
            Manage static pages ({pages.length} pages)
          </p>
        </div>
        <Link
          href="/admin/pages/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D4FF] text-[#0A1628] font-medium rounded-lg hover:bg-[#00D4FF]/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Page
        </Link>
      </div>

      {/* Pages Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-secondary/50">
              <tr className="text-left text-sm text-muted-foreground">
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Slug</th>
                <th className="p-4 font-medium">Template</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Last Updated</th>
                <th className="p-4 font-medium w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    No pages found
                  </td>
                </tr>
              ) : (
                pages.map((page) => (
                  <tr key={page.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-4">
                      <p className="font-medium">{page.title}</p>
                    </td>
                    <td className="p-4">
                      <code className="text-sm bg-secondary px-2 py-1 rounded">
                        /{page.slug}
                      </code>
                    </td>
                    <td className="p-4 text-sm">{page.template}</td>
                    <td className="p-4">{getStatusBadge(page.status)}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDate(page.updatedAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-secondary transition-colors"
                          title="View Page"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                        <Link
                          href={`/admin/pages/${page.id}`}
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
      </div>
    </div>
  );
}
