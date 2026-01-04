import Link from "next/link";
import { Fish, Facebook, Instagram, Youtube, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  shop: [
    { name: "Freshwater Fish", href: "/category/freshwater-fish" },
    { name: "Aquatic Plants", href: "/category/plants" },
    { name: "Shrimp & Invertebrates", href: "/category/shrimp" },
    { name: "Equipment", href: "/category/equipment" },
    { name: "Food & Nutrition", href: "/category/food" },
    { name: "New Arrivals", href: "/new-arrivals" },
  ],
  support: [
    { name: "Contact Us", href: "/contact" },
    { name: "FAQs", href: "/faqs" },
    { name: "Shipping Info", href: "/shipping" },
    { name: "Returns & Refunds", href: "/returns" },
    { name: "Track Order", href: "/track-order" },
    { name: "Live Stock Policy", href: "/livestock-policy" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Blog & Guides", href: "/blog" },
    { name: "Careers", href: "/careers" },
    { name: "Partner With Us", href: "/partner" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Refund Policy", href: "/refund-policy" },
  ],
};

const socialLinks = [
  { name: "Facebook", icon: Facebook, href: "#" },
  { name: "Instagram", icon: Instagram, href: "#" },
  { name: "YouTube", icon: Youtube, href: "#" },
  { name: "Twitter", icon: Twitter, href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-ocean-dark border-t border-border">
      {/* Newsletter Section */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-2">Stay in the Loop</h3>
            <p className="text-muted-foreground mb-6">
              Subscribe to get exclusive offers, new arrivals, and aquarium care tips.
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1"
                icon={<Mail className="h-4 w-4" />}
              />
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Fish className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold font-display">
                <span className="text-gradient-aqua">Aqua</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm mb-4 max-w-xs">
              Your one-stop destination for premium aquarium products, healthy livestock,
              and expert care guides.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>support@aqua.store</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Mumbai, India</span>
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Separator />

      {/* Bottom Footer */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Aqua. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            {socialLinks.map((social) => (
              <Button
                key={social.name}
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                asChild
              >
                <a href={social.href} target="_blank" rel="noopener noreferrer">
                  <social.icon className="h-4 w-4" />
                  <span className="sr-only">{social.name}</span>
                </a>
              </Button>
            ))}
          </div>

          {/* Payment Methods */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>We accept:</span>
            <div className="flex gap-1">
              <div className="px-2 py-1 bg-secondary rounded text-[10px] font-medium">UPI</div>
              <div className="px-2 py-1 bg-secondary rounded text-[10px] font-medium">Cards</div>
              <div className="px-2 py-1 bg-secondary rounded text-[10px] font-medium">NetBanking</div>
              <div className="px-2 py-1 bg-secondary rounded text-[10px] font-medium">COD</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
