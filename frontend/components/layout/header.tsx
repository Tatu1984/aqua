"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  ChevronDown,
  Fish,
  Leaf,
  Settings,
  Droplets,
  Package,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { CartDrawer } from "@/components/cart/cart-drawer";

const categories = [
  {
    name: "Livestock",
    href: "/category/livestock",
    icon: Fish,
    children: [
      { name: "Freshwater Fish", href: "/category/freshwater-fish" },
      { name: "Shrimp & Invertebrates", href: "/category/shrimp" },
      { name: "Snails", href: "/category/snails" },
    ],
  },
  {
    name: "Plants",
    href: "/category/plants",
    icon: Leaf,
    children: [
      { name: "Foreground Plants", href: "/category/foreground-plants" },
      { name: "Midground Plants", href: "/category/midground-plants" },
      { name: "Background Plants", href: "/category/background-plants" },
      { name: "Floating Plants", href: "/category/floating-plants" },
    ],
  },
  {
    name: "Equipment",
    href: "/category/equipment",
    icon: Settings,
    children: [
      { name: "Filters", href: "/category/filters" },
      { name: "Lighting", href: "/category/lighting" },
      { name: "Heaters", href: "/category/heaters" },
      { name: "Air Pumps", href: "/category/air-pumps" },
      { name: "CO2 Systems", href: "/category/co2-systems" },
    ],
  },
  {
    name: "Aquariums",
    href: "/category/aquariums",
    icon: Droplets,
    children: [
      { name: "Nano Tanks", href: "/category/nano-tanks" },
      { name: "Standard Tanks", href: "/category/standard-tanks" },
      { name: "Rimless Tanks", href: "/category/rimless-tanks" },
    ],
  },
  {
    name: "Supplies",
    href: "/category/supplies",
    icon: Package,
    children: [
      { name: "Food & Nutrition", href: "/category/food" },
      { name: "Water Care", href: "/category/water-care" },
      { name: "Substrates", href: "/category/substrates" },
      { name: "Decorations", href: "/category/decorations" },
    ],
  },
];

export function Header() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [cartOpen, setCartOpen] = React.useState(false);

  const { items } = useCart();
  const { user, logout, checkAuth } = useAuth();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-background/95 backdrop-blur-md shadow-lg border-b border-border"
            : "bg-transparent"
        )}
      >
        {/* Top bar */}
        <div className="hidden lg:block border-b border-border/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-8 text-xs text-muted-foreground">
              <p>Free shipping on orders over ₹999</p>
              <div className="flex items-center gap-4">
                <Link href="/search" className="hover:text-primary transition-colors">
                  Search
                </Link>
                <Link href="/account/orders" className="hover:text-primary transition-colors">
                  Track Order
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 space-y-1">
                  {categories.map((category) => (
                    <div key={category.name}>
                      <Link
                        href={category.href}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <category.icon className="h-5 w-5 text-primary" />
                        <span>{category.name}</span>
                      </Link>
                      <div className="ml-8 space-y-1">
                        {category.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className="block px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Fish className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent animate-pulse" />
              </div>
              <span className="text-xl lg:text-2xl font-bold font-display tracking-tight">
                <span className="text-gradient-aqua">Aqua</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {categories.map((category) => (
                <div
                  key={category.name}
                  className="relative"
                  onMouseEnter={() => setActiveCategory(category.name)}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  <Link
                    href={category.href}
                    className={cn(
                      "flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                      "hover:bg-secondary hover:text-foreground",
                      activeCategory === category.name
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {category.name}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        activeCategory === category.name && "rotate-180"
                      )}
                    />
                  </Link>

                  <AnimatePresence>
                    {activeCategory === category.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 pt-2 w-56"
                      >
                        <div className="bg-card border border-border rounded-xl shadow-xl p-2">
                          {category.children.map((child) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              className="block px-3 py-2 text-sm rounded-lg hover:bg-secondary transition-colors"
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Search & Actions */}
            <div className="flex items-center gap-2">
              {/* Desktop Search */}
              <form onSubmit={handleSearch} className="hidden md:block relative w-64 lg:w-80">
                <Input
                  placeholder="Search products..."
                  className="pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </button>
              </form>

              {/* Mobile Search Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Wishlist */}
              <Link href="/account/wishlist">
                <Button variant="ghost" size="icon" className="hidden sm:flex relative">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>

              {/* Cart */}
              <Button variant="ghost" size="icon" className="relative" onClick={() => setCartOpen(true)}>
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge
                    variant="aqua"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                  >
                    {cartCount}
                  </Badge>
                )}
              </Button>

              {/* Account */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {user ? (
                    <>
                      <DropdownMenuLabel>
                        {user.firstName || user.email}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/account" className="flex w-full cursor-pointer">
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/orders" className="flex w-full cursor-pointer">
                          Orders
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/wishlist" className="flex w-full cursor-pointer">
                          Wishlist
                        </Link>
                      </DropdownMenuItem>
                      {user.role === "ADMIN" && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex w-full cursor-pointer">
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuLabel>Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/login" className="flex w-full cursor-pointer">
                          Sign In
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/register" className="flex w-full cursor-pointer">
                          Create Account
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border overflow-hidden"
            >
              <form onSubmit={handleSearch} className="container mx-auto px-4 py-3">
                <Input
                  placeholder="Search products..."
                  className="w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
}
