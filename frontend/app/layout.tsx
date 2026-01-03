import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Aqua - Premium Aquarium Products & Livestock",
    template: "%s | Aqua",
  },
  description:
    "Your one-stop destination for premium aquarium products, healthy livestock, live plants, and expert care guides. Shop fish, shrimp, equipment & more.",
  keywords: [
    "aquarium",
    "fish",
    "aquatic plants",
    "shrimp",
    "aquarium equipment",
    "fish tank",
    "livestock",
    "freshwater fish",
    "planted tank",
  ],
  authors: [{ name: "Aqua" }],
  creator: "Aqua",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://aqua.store",
    siteName: "Aqua",
    title: "Aqua - Premium Aquarium Products & Livestock",
    description:
      "Your one-stop destination for premium aquarium products, healthy livestock, live plants, and expert care guides.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aqua - Premium Aquarium Products & Livestock",
    description:
      "Your one-stop destination for premium aquarium products, healthy livestock, live plants, and expert care guides.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
