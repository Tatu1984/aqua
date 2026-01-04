"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Menu, ChevronRight, GripVertical } from "lucide-react";

interface MenuItem {
  id: string;
  title: string;
  url: string | null;
  type: string;
  isActive: boolean;
  children?: MenuItem[];
}

interface MenuType {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  items: MenuItem[];
}

function getLocationBadge(location: string | null) {
  const locations: Record<string, { bg: string; text: string }> = {
    header: { bg: "bg-blue-500/20", text: "text-blue-400" },
    footer: { bg: "bg-purple-500/20", text: "text-purple-400" },
    mobile: { bg: "bg-orange-500/20", text: "text-orange-400" },
  };
  if (!location) return null;
  const style = locations[location] || { bg: "bg-gray-500/20", text: "text-gray-400" };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>{location}</span>;
}

export default function MenusPage() {
  const [menus, setMenus] = useState<MenuType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchMenus(); }, []);

  const fetchMenus = async () => {
    try {
      const res = await fetch("/api/admin/menus");
      const data = await res.json();
      setMenus(data.menus || data || []);
    } catch (error) {
      console.error("Failed to fetch menus:", error);
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
          <h1 className="text-2xl font-bold">Menus</h1>
          <p className="text-muted-foreground">Manage navigation menus ({menus.length} menus)</p>
        </div>
        <Link href="/admin/menus/new" className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D4FF] text-[#0A1628] font-medium rounded-lg hover:bg-[#00D4FF]/90 transition-colors">
          <Plus className="h-4 w-4" />Add Menu
        </Link>
      </div>

      {menus.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Menu className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No menus found</p>
          <Link href="/admin/menus/new" className="inline-flex items-center gap-2 mt-4 text-[#00D4FF] hover:underline"><Plus className="h-4 w-4" />Create your first menu</Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {menus.map((menu) => (
            <div key={menu.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
                <div className="flex items-center gap-3">
                  <Menu className="h-5 w-5 text-[#00D4FF]" />
                  <div>
                    <h2 className="font-semibold">{menu.name}</h2>
                    <code className="text-xs text-muted-foreground">{menu.slug}</code>
                  </div>
                  {getLocationBadge(menu.location)}
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/menus/${menu.id}`} className="p-2 rounded-lg hover:bg-secondary transition-colors"><Edit className="h-4 w-4" /></Link>
                  <button className="p-2 rounded-lg hover:bg-destructive/20 text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {menu.items?.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">No menu items. <Link href={`/admin/menus/${menu.id}`} className="text-[#00D4FF] hover:underline">Add items</Link></div>
              ) : (
                <div className="p-4 space-y-2">
                  {menu.items?.map((item) => (
                    <div key={item.id}>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors group">
                        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
                        <span className="font-medium">{item.title}</span>
                        {item.url && <span className="text-xs text-muted-foreground">{item.url}</span>}
                        <span className="text-xs px-2 py-0.5 bg-secondary rounded">{item.type}</span>
                        {!item.isActive && <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">Hidden</span>}
                      </div>
                      {item.children && item.children.length > 0 && (
                        <div className="ml-8 mt-1 space-y-1 border-l border-border pl-4">
                          {item.children.map((child) => (
                            <div key={child.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors group">
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{child.title}</span>
                              {child.url && <span className="text-xs text-muted-foreground">{child.url}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
