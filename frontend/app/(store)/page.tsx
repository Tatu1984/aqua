import Link from "next/link";
import { ArrowRight, Truck, Shield, Clock, HeadphonesIcon } from "lucide-react";
import { WaterHero, CategoryCard, SectionHeader } from "@/components/home";
import { ProductCard } from "@/components/product";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProducts, getCategories } from "@/lib/api";

const benefits = [
  {
    icon: Truck,
    title: "Express Shipping",
    description: "Live arrival guaranteed for livestock",
  },
  {
    icon: Shield,
    title: "Quality Assured",
    description: "Healthy, quarantined specimens",
  },
  {
    icon: Clock,
    title: "Same Day Dispatch",
    description: "Order before 2 PM for same day",
  },
  {
    icon: HeadphonesIcon,
    title: "Expert Support",
    description: "Aquarist help available 24/7",
  },
];

export default async function HomePage() {
  // Fetch data from API
  let categories: { name: string; slug: string; image?: string; productCount: number; description?: string }[] = [];
  let featuredProducts: ReturnType<typeof getProducts> extends Promise<infer T> ? T extends { products: infer P } ? P : never : never = [];
  let trendingProducts: typeof featuredProducts = [];

  try {
    const [categoriesData, featuredData, trendingData] = await Promise.all([
      getCategories(),
      getProducts({ featured: true, limit: 4 }),
      getProducts({ limit: 4, sort: "newest" }),
    ]);

    categories = categoriesData.categories.slice(0, 4).map((cat) => ({
      name: cat.name,
      slug: cat.slug,
      image: cat.image,
      productCount: cat.productCount,
      description: cat.description,
    }));

    featuredProducts = featuredData.products;
    trendingProducts = trendingData.products;
  } catch (error) {
    console.error("Failed to fetch homepage data:", error);
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden -mt-24">
        <WaterHero />

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <Badge variant="aqua" className="mb-4">
            New Arrivals Weekly
          </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display mb-6 max-w-4xl mx-auto">
            Dive Into Your
            <span className="text-gradient-aqua block">Dream Aquarium</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Premium livestock, live plants, and professional-grade equipment.
            Everything you need to create a stunning underwater world.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" asChild>
              <Link href="/category/freshwater-fish">
                Shop Livestock
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/category/plants">Explore Plants</Link>
            </Button>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1">
              <div className="w-1.5 h-3 rounded-full bg-primary animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Bar */}
      <section className="bg-card border-y border-border py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{benefit.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <SectionHeader
              title="Shop by Category"
              subtitle="Find exactly what you're looking for"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {categories.map((category, index) => (
                <CategoryCard
                  key={category.slug}
                  category={category}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <section className="py-16 md:py-24 bg-card/50">
          <div className="container mx-auto px-4">
            <SectionHeader
              title="Trending Now"
              subtitle="Most popular picks this week"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {trendingProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    compareAtPrice: product.compareAtPrice,
                    image: product.image || "https://via.placeholder.com/400",
                    category: product.category,
                    stockStatus: product.stockStatus as "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK",
                    isLivestock: product.isLivestock,
                    livestockData: product.livestockData,
                    isFeatured: product.isFeatured,
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <SectionHeader
              title="Featured Livestock"
              subtitle="Healthy, quarantined specimens ready for your tank"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    compareAtPrice: product.compareAtPrice,
                    image: product.image || "https://via.placeholder.com/400",
                    category: product.category,
                    stockStatus: product.stockStatus as "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK",
                    isLivestock: product.isLivestock,
                    livestockData: product.livestockData,
                    isFeatured: product.isFeatured,
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20" />
        <div className="absolute inset-0 water-overlay" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              First Time Here?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Get 10% off your first order when you sign up for our newsletter.
              Plus, receive exclusive care guides and early access to new arrivals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="coral" asChild>
                <Link href="/register">
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/blog">Read Care Guides</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
