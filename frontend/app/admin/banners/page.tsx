"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  link: string | null;
  position: string;
  isActive: boolean;
  updatedAt: string;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch("/api/admin/banners");
      const data = await res.json();
      setBanners(data.banners || data || []);
    } catch (error) {
      console.error("Failed to fetch banners:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]" /></div>;
  }

  const positions = [...new Set(banners.map(b => b.position))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Banners</h1>
          <p className="text-muted-foreground">Manage promotional banners ({banners.length} banners)</p>
        </div>
        <Link href="/admin/banners/new" className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D4FF] text-[#0A1628] font-medium rounded-lg hover:bg-[#00D4FF]/90 transition-colors">
          <Plus className="h-4 w-4" />Add Banner
        </Link>
      </div>

      {positions.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No banners found</p>
          <Link href="/admin/banners/new" className="inline-flex items-center gap-2 mt-4 text-[#00D4FF] hover:underline"><Plus className="h-4 w-4" />Create your first banner</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {positions.map((position) => {
            const positionBanners = banners.filter(b => b.position === position);
            return (
              <div key={position} className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/30">
                  <h2 className="font-semibold capitalize">{position.replace(/_/g, " ")}</h2>
                  <p className="text-sm text-muted-foreground">{positionBanners.length} banner{positionBanners.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="divide-y divide-border">
                  {positionBanners.map((banner) => (
                    <div key={banner.id} className="p-4 flex items-center gap-4">
                      <div className="relative w-32 h-20 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                        {banner.image ? <Image src={banner.image} alt={banner.title} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{banner.title}</p>
                          {banner.isActive ? <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400">Active</span> : <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400">Inactive</span>}
                        </div>
                        {banner.subtitle && <p className="text-sm text-muted-foreground truncate">{banner.subtitle}</p>}
                        <p className="text-xs text-muted-foreground mt-1">{banner.link && <span>Links to: {banner.link} • </span>}Updated {formatDate(banner.updatedAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/banners/${banner.id}`} className="p-2 rounded-lg hover:bg-secondary transition-colors"><Edit className="h-4 w-4" /></Link>
                        <button className="p-2 rounded-lg hover:bg-destructive/20 text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
