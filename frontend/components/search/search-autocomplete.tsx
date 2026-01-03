"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Loader2, Tag, Package } from "lucide-react";
import { Input } from "@/components/ui/input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ProductSuggestion {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
  type: "product";
}

interface CategorySuggestion {
  id: string;
  name: string;
  slug: string;
  type: "category";
}

interface Suggestions {
  products: ProductSuggestion[];
  categories: CategorySuggestion[];
}

export function SearchAutocomplete({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setSuggestions(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/api/search/suggestions?q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions);
          setOpen(true);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setOpen(false);
    }
  };

  const handleProductClick = (slug: string) => {
    router.push(`/product/${slug}`);
    setOpen(false);
    setQuery("");
  };

  const handleCategoryClick = (slug: string) => {
    router.push(`/category/${slug}`);
    setOpen(false);
    setQuery("");
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);

  const hasSuggestions =
    suggestions &&
    (suggestions.products.length > 0 || suggestions.categories.length > 0);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Input
            placeholder="Search products..."
            className="pr-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => hasSuggestions && setOpen(true)}
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {open && hasSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
          {/* Categories */}
          {suggestions.categories.length > 0 && (
            <div className="p-2 border-b border-border">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                Categories
              </p>
              {suggestions.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary transition-colors text-left"
                >
                  <Tag className="h-4 w-4 text-primary" />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Products */}
          {suggestions.products.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                Products
              </p>
              {suggestions.products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product.slug)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary transition-colors text-left"
                >
                  {product.image ? (
                    <div className="relative w-10 h-10 rounded bg-secondary overflow-hidden flex-shrink-0">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-sm text-primary">{formatPrice(product.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* View all results */}
          <button
            onClick={handleSubmit}
            className="w-full p-3 text-center text-sm text-primary hover:bg-secondary transition-colors border-t border-border"
          >
            View all results for &quot;{query}&quot;
          </button>
        </div>
      )}
    </div>
  );
}
