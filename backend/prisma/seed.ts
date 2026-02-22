import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedMenusAndPages() {
  console.log("Seeding menus and pages...");

  // --- Header Menu ---
  const headerMenu = await prisma.menu.upsert({
    where: { slug: "header" },
    update: { name: "Header Navigation", location: "header" },
    create: { name: "Header Navigation", slug: "header", location: "header" },
  });
  await prisma.menuItem.deleteMany({ where: { menuId: headerMenu.id } });

  const headerCategories = [
    {
      title: "Livestock",
      url: "/category/livestock",
      children: [
        { title: "Freshwater Fish", url: "/category/freshwater-fish" },
        { title: "Shrimp & Invertebrates", url: "/category/shrimp" },
        { title: "Snails", url: "/category/snails" },
      ],
    },
    {
      title: "Plants",
      url: "/category/plants",
      children: [
        { title: "Foreground Plants", url: "/category/foreground-plants" },
        { title: "Midground Plants", url: "/category/midground-plants" },
        { title: "Background Plants", url: "/category/background-plants" },
        { title: "Floating Plants", url: "/category/floating-plants" },
      ],
    },
    {
      title: "Equipment",
      url: "/category/equipment",
      children: [
        { title: "Filters", url: "/category/filters" },
        { title: "Lighting", url: "/category/lighting" },
        { title: "Heaters", url: "/category/heaters" },
        { title: "Air Pumps", url: "/category/air-pumps" },
        { title: "CO2 Systems", url: "/category/co2-systems" },
      ],
    },
    {
      title: "Aquariums",
      url: "/category/aquariums",
      children: [
        { title: "Nano Tanks", url: "/category/nano-tanks" },
        { title: "Standard Tanks", url: "/category/standard-tanks" },
        { title: "Rimless Tanks", url: "/category/rimless-tanks" },
      ],
    },
    {
      title: "Supplies",
      url: "/category/supplies",
      children: [
        { title: "Food & Nutrition", url: "/category/food" },
        { title: "Water Care", url: "/category/water-care" },
        { title: "Substrates", url: "/category/substrates" },
        { title: "Decorations", url: "/category/decorations" },
      ],
    },
  ];

  for (let i = 0; i < headerCategories.length; i++) {
    const cat = headerCategories[i];
    const parent = await prisma.menuItem.create({
      data: {
        menuId: headerMenu.id,
        title: cat.title,
        url: cat.url,
        type: "CATEGORY",
        sortOrder: i,
        isActive: true,
      },
    });
    for (let j = 0; j < cat.children.length; j++) {
      const child = cat.children[j];
      await prisma.menuItem.create({
        data: {
          menuId: headerMenu.id,
          parentId: parent.id,
          title: child.title,
          url: child.url,
          type: "CATEGORY",
          sortOrder: j,
          isActive: true,
        },
      });
    }
  }

  // --- Footer Menus ---
  const footerMenuDefs = [
    {
      slug: "footer-shop",
      name: "Shop",
      items: [
        { title: "Freshwater Fish", url: "/category/freshwater-fish" },
        { title: "Aquatic Plants", url: "/category/plants" },
        { title: "Shrimp & Invertebrates", url: "/category/shrimp" },
        { title: "Equipment", url: "/category/equipment" },
        { title: "Food & Nutrition", url: "/category/food" },
        { title: "New Arrivals", url: "/new-arrivals" },
      ],
    },
    {
      slug: "footer-support",
      name: "Support",
      items: [
        { title: "Contact Us", url: "/contact" },
        { title: "FAQs", url: "/faqs" },
        { title: "Shipping Info", url: "/shipping-info" },
        { title: "Returns & Refunds", url: "/returns" },
        { title: "Track Order", url: "/account/orders" },
        { title: "Live Stock Policy", url: "/livestock-policy" },
      ],
    },
    {
      slug: "footer-company",
      name: "Company",
      items: [
        { title: "About Us", url: "/about" },
        { title: "Blog & Guides", url: "/blog" },
        { title: "Careers", url: "/careers" },
        { title: "Partner With Us", url: "/partner" },
      ],
    },
    {
      slug: "footer-legal",
      name: "Legal",
      items: [
        { title: "Privacy Policy", url: "/privacy-policy" },
        { title: "Terms of Service", url: "/terms-of-service" },
        { title: "Refund Policy", url: "/refund-policy" },
      ],
    },
  ];

  for (const def of footerMenuDefs) {
    const menu = await prisma.menu.upsert({
      where: { slug: def.slug },
      update: { name: def.name, location: "footer" },
      create: { name: def.name, slug: def.slug, location: "footer" },
    });
    await prisma.menuItem.deleteMany({ where: { menuId: menu.id } });
    for (let i = 0; i < def.items.length; i++) {
      await prisma.menuItem.create({
        data: {
          menuId: menu.id,
          title: def.items[i].title,
          url: def.items[i].url,
          type: "CUSTOM",
          sortOrder: i,
          isActive: true,
        },
      });
    }
  }

  // --- Pages ---
  const pages = [
    {
      slug: "about",
      title: "About Us",
      content: "<h1>About Aqua</h1><p>Aqua is your one-stop destination for premium aquarium products, healthy livestock, and expert care guides. We are passionate about the aquarium hobby and committed to providing the best products and advice to our customers.</p><p>Founded by aquarium enthusiasts, we understand the joy and challenges of maintaining beautiful aquatic environments. Our team carefully selects every product and livestock to ensure the highest quality for your aquarium.</p>",
    },
    {
      slug: "contact",
      title: "Contact Us",
      content: "<h1>Contact Us</h1><p>We'd love to hear from you! Reach out to us through any of the following channels:</p><ul><li><strong>Email:</strong> support@aqua.store</li><li><strong>Phone:</strong> +91 98765 43210</li><li><strong>Address:</strong> Mumbai, India</li></ul><p>Our support team is available Monday to Saturday, 9 AM to 6 PM IST.</p>",
    },
    {
      slug: "faqs",
      title: "Frequently Asked Questions",
      content: "<h1>FAQs</h1><h2>Ordering</h2><p><strong>How do I place an order?</strong><br/>Browse our products, add items to your cart, and proceed to checkout.</p><h2>Shipping</h2><p><strong>Do you ship live fish?</strong><br/>Yes, we ship live fish and invertebrates via express delivery to select cities.</p><h2>Returns</h2><p><strong>What is your return policy?</strong><br/>We accept returns within 7 days for non-livestock items. Please see our Returns & Refunds page for details.</p>",
    },
    {
      slug: "shipping-info",
      title: "Shipping Information",
      content: "<h1>Shipping Information</h1><p>We offer nationwide shipping for non-livestock items. Live fish and invertebrates are shipped via express delivery to select cities only.</p><h2>Delivery Times</h2><ul><li><strong>Standard Shipping:</strong> 5-7 business days</li><li><strong>Express Shipping:</strong> 1-2 business days</li></ul><h2>Free Shipping</h2><p>Orders over ₹999 qualify for free standard shipping.</p>",
    },
    {
      slug: "returns",
      title: "Returns & Refunds",
      content: "<h1>Returns & Refunds</h1><p>We want you to be completely satisfied with your purchase.</p><h2>Non-Livestock Items</h2><p>You may return non-livestock items within 7 days of delivery for a full refund. Items must be unused and in original packaging.</p><h2>Livestock</h2><p>Due to the nature of live animals, we offer a Dead on Arrival (DOA) guarantee. Please photograph any DOA livestock within 2 hours of delivery and contact our support team.</p>",
    },
    {
      slug: "livestock-policy",
      title: "Live Stock Policy",
      content: "<h1>Live Stock Policy</h1><p>We take the health and safety of our livestock very seriously.</p><h2>Shipping</h2><p>All livestock is shipped via express delivery with insulated packaging and heat/cold packs as needed.</p><h2>DOA Guarantee</h2><p>We guarantee live arrival. If any livestock arrives dead, please send photos within 2 hours of delivery for a full refund or replacement.</p><h2>Acclimation</h2><p>Please follow proper acclimation procedures when introducing new livestock to your aquarium.</p>",
    },
    {
      slug: "privacy-policy",
      title: "Privacy Policy",
      content: "<h1>Privacy Policy</h1><p>Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.</p><h2>Information We Collect</h2><p>We collect information you provide directly, such as your name, email, phone number, and shipping address when you create an account or place an order.</p><h2>How We Use Your Information</h2><p>We use your information to process orders, communicate with you, and improve our services.</p><h2>Data Security</h2><p>We implement appropriate security measures to protect your personal information.</p>",
    },
    {
      slug: "terms-of-service",
      title: "Terms of Service",
      content: "<h1>Terms of Service</h1><p>By using Aqua, you agree to these terms of service.</p><h2>Account</h2><p>You are responsible for maintaining the security of your account and password.</p><h2>Orders</h2><p>All orders are subject to availability. We reserve the right to refuse or cancel orders at our discretion.</p><h2>Pricing</h2><p>All prices are listed in Indian Rupees (₹) and include applicable taxes.</p>",
    },
    {
      slug: "refund-policy",
      title: "Refund Policy",
      content: "<h1>Refund Policy</h1><p>We offer refunds under the following conditions:</p><ul><li>Non-livestock items returned within 7 days in original condition</li><li>Livestock that arrives dead (DOA guarantee)</li><li>Damaged or defective products</li></ul><p>Refunds are processed within 5-7 business days to your original payment method.</p>",
    },
  ];

  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        content: page.content,
        status: "PUBLISHED",
      },
      create: {
        title: page.title,
        slug: page.slug,
        content: page.content,
        seoTitle: page.title,
        seoDescription: `${page.title} - Aqua Store`,
        status: "PUBLISHED",
      },
    });
  }

  console.log("Menus and pages seeded successfully!");
}

async function main() {
  console.log("Seeding database...");

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "freshwater-fish" },
      update: {},
      create: {
        name: "Freshwater Fish",
        slug: "freshwater-fish",
        description: "Vibrant and healthy freshwater species for your aquarium",
        image: "https://picsum.photos/seed/catfish/800/600",
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: "plants" },
      update: {},
      create: {
        name: "Aquatic Plants",
        slug: "plants",
        description: "Live plants for stunning aquascapes",
        image: "https://picsum.photos/seed/catplants/800/600",
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: "shrimp" },
      update: {},
      create: {
        name: "Shrimp & Invertebrates",
        slug: "shrimp",
        description: "Colorful shrimp and invertebrates",
        image: "https://picsum.photos/seed/catshrimp/800/600",
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: "equipment" },
      update: {},
      create: {
        name: "Equipment",
        slug: "equipment",
        description: "Filters, lights, heaters and more",
        image: "https://picsum.photos/seed/catequip/800/600",
        sortOrder: 4,
      },
    }),
    prisma.category.upsert({
      where: { slug: "food" },
      update: {},
      create: {
        name: "Food & Nutrition",
        slug: "food",
        description: "Premium fish food and supplements",
        image: "https://picsum.photos/seed/catfood/800/600",
        sortOrder: 5,
      },
    }),
  ]);

  const [fishCat, plantCat, shrimpCat, equipCat, foodCat] = categories;

  // Create products
  const products = [
    // Fish
    {
      name: "Neon Tetra (School of 10)",
      slug: "neon-tetra-school-10",
      sku: "FISH-TET-NEON-001",
      description: "The neon tetra (Paracheirodon innesi) is a freshwater fish of the characin family. It is native to blackwater and clearwater streams in the Amazon basin. Known for their vibrant blue and red coloration, neon tetras are peaceful schooling fish that make excellent additions to community tanks.",
      shortDescription: "Vibrant schooling fish with iconic blue and red stripes",
      price: 299,
      compareAtPrice: 399,
      stockQuantity: 150,
      stockStatus: "IN_STOCK",
      categoryId: fishCat.id,
      isLivestock: true,
      livestockData: JSON.stringify({
        minTemp: 22,
        maxTemp: 26,
        minPh: 6.0,
        maxPh: 7.0,
        difficulty: "BEGINNER",
        careGuide: "Keep in schools of 6+. Prefer soft, acidic water.",
      }),
      isFeatured: true,
      expressOnly: true,
      shippingRestricted: true,
      allowedPincodes: JSON.stringify(["Mumbai", "Delhi", "Bangalore", "Hyderabad"]),
    },
    {
      name: "Betta Fish - Halfmoon Male",
      slug: "betta-halfmoon-male",
      sku: "FISH-BET-HM-001",
      description: "The Halfmoon Betta is one of the most stunning varieties of Siamese fighting fish. Named for their 180-degree tail spread that resembles a half moon, these fish display incredible finnage and vibrant colors.",
      shortDescription: "Stunning male Betta with 180° tail spread",
      price: 499,
      compareAtPrice: 599,
      stockQuantity: 25,
      stockStatus: "IN_STOCK",
      categoryId: fishCat.id,
      isLivestock: true,
      livestockData: JSON.stringify({
        minTemp: 24,
        maxTemp: 28,
        minPh: 6.5,
        maxPh: 7.5,
        difficulty: "BEGINNER",
        careGuide: "Keep alone or with peaceful tankmates. Needs 5+ gallon tank.",
      }),
      isFeatured: true,
      expressOnly: true,
      shippingRestricted: true,
      allowedPincodes: JSON.stringify(["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai"]),
    },
    {
      name: "Cardinal Tetra (School of 10)",
      slug: "cardinal-tetra-10",
      sku: "FISH-TET-CARD-001",
      description: "Cardinal tetras are similar to neon tetras but with more vibrant coloration extending the full length of the body. They are excellent community fish.",
      shortDescription: "Vibrant tetra with full-body red stripe",
      price: 399,
      stockQuantity: 80,
      stockStatus: "IN_STOCK",
      categoryId: fishCat.id,
      isLivestock: true,
      livestockData: JSON.stringify({
        minTemp: 23,
        maxTemp: 27,
        minPh: 5.5,
        maxPh: 7.0,
        difficulty: "INTERMEDIATE",
      }),
      expressOnly: true,
      shippingRestricted: true,
      allowedPincodes: JSON.stringify(["Mumbai", "Delhi", "Bangalore"]),
    },
    {
      name: "Corydoras Panda",
      slug: "corydoras-panda",
      sku: "FISH-CORY-PAN-001",
      description: "Corydoras panda is a small, peaceful bottom-dwelling catfish with distinctive black and white markings resembling a panda. Great for cleaning up leftover food.",
      shortDescription: "Adorable bottom-dwelling catfish",
      price: 199,
      compareAtPrice: 249,
      stockQuantity: 12,
      stockStatus: "LOW_STOCK",
      categoryId: fishCat.id,
      isLivestock: true,
      livestockData: JSON.stringify({
        minTemp: 22,
        maxTemp: 26,
        minPh: 6.0,
        maxPh: 7.5,
        difficulty: "BEGINNER",
      }),
      expressOnly: true,
      shippingRestricted: true,
      allowedPincodes: JSON.stringify(["Mumbai", "Delhi", "Bangalore", "Hyderabad"]),
    },
    {
      name: "Guppy Assorted (5 Pairs)",
      slug: "guppy-assorted-5-pairs",
      sku: "FISH-GUP-AST-001",
      description: "Colorful assorted guppies, perfect for beginners. These hardy fish come in a variety of colors and patterns.",
      shortDescription: "Colorful and hardy beginner fish",
      price: 349,
      stockQuantity: 50,
      stockStatus: "IN_STOCK",
      categoryId: fishCat.id,
      isLivestock: true,
      livestockData: JSON.stringify({
        minTemp: 22,
        maxTemp: 28,
        minPh: 6.8,
        maxPh: 7.8,
        difficulty: "BEGINNER",
      }),
      expressOnly: true,
      shippingRestricted: true,
      allowedPincodes: JSON.stringify(["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune"]),
    },

    // Plants
    {
      name: "Java Fern - Large",
      slug: "java-fern-large",
      sku: "PLANT-JF-LRG-001",
      description: "Java Fern is one of the most popular aquarium plants due to its hardy nature and low maintenance requirements. It can thrive in low light conditions and doesn't require CO2 supplementation.",
      shortDescription: "Hardy, low-maintenance aquatic plant",
      price: 149,
      stockQuantity: 45,
      stockStatus: "IN_STOCK",
      categoryId: plantCat.id,
      isFeatured: true,
    },
    {
      name: "Anubias Nana",
      slug: "anubias-nana",
      sku: "PLANT-AN-NANA-001",
      description: "Anubias Nana is a compact, slow-growing plant perfect for the foreground or midground. Its thick, dark green leaves are resistant to herbivorous fish.",
      shortDescription: "Compact plant with thick, sturdy leaves",
      price: 199,
      stockQuantity: 30,
      stockStatus: "IN_STOCK",
      categoryId: plantCat.id,
    },
    {
      name: "Amazon Sword - Medium",
      slug: "amazon-sword-medium",
      sku: "PLANT-AS-MED-001",
      description: "The Amazon Sword is a classic aquarium plant with large, sword-shaped leaves. It makes an excellent background plant and provides cover for fish.",
      shortDescription: "Classic background plant with sword-shaped leaves",
      price: 179,
      compareAtPrice: 229,
      stockQuantity: 25,
      stockStatus: "IN_STOCK",
      categoryId: plantCat.id,
    },
    {
      name: "Monte Carlo Carpet (Tissue Culture)",
      slug: "monte-carlo-carpet-tc",
      sku: "PLANT-MC-TC-001",
      description: "Monte Carlo creates a beautiful, dense carpet of small round leaves. This tissue culture version is pest and algae-free.",
      shortDescription: "Lush carpeting plant for aquascaping",
      price: 299,
      stockQuantity: 15,
      stockStatus: "IN_STOCK",
      categoryId: plantCat.id,
      isFeatured: true,
    },

    // Shrimp
    {
      name: "Cherry Shrimp (Pack of 10)",
      slug: "cherry-shrimp-10",
      sku: "SHRIMP-CH-10-001",
      description: "Red Cherry Shrimp are hardy, easy to keep, and excellent algae eaters. Their bright red color adds a pop of color to any planted tank.",
      shortDescription: "Hardy red shrimp, great algae eaters",
      price: 399,
      stockQuantity: 8,
      stockStatus: "LOW_STOCK",
      categoryId: shrimpCat.id,
      isLivestock: true,
      livestockData: JSON.stringify({
        minTemp: 20,
        maxTemp: 28,
        minPh: 6.5,
        maxPh: 8.0,
        difficulty: "BEGINNER",
      }),
      isFeatured: true,
      expressOnly: true,
      shippingRestricted: true,
      allowedPincodes: JSON.stringify(["Mumbai", "Delhi", "Bangalore"]),
    },
    {
      name: "Blue Dream Shrimp (Pack of 5)",
      slug: "blue-dream-shrimp-5",
      sku: "SHRIMP-BD-5-001",
      description: "Blue Dream Shrimp are a stunning variety with deep blue coloration. They are a color variant of the Cherry Shrimp and equally easy to keep.",
      shortDescription: "Stunning deep blue shrimp",
      price: 499,
      stockQuantity: 20,
      stockStatus: "IN_STOCK",
      categoryId: shrimpCat.id,
      isLivestock: true,
      livestockData: JSON.stringify({
        minTemp: 18,
        maxTemp: 26,
        minPh: 6.2,
        maxPh: 8.0,
        difficulty: "BEGINNER",
      }),
      expressOnly: true,
      shippingRestricted: true,
      allowedPincodes: JSON.stringify(["Mumbai", "Delhi", "Bangalore"]),
    },
    {
      name: "Amano Shrimp (Pack of 5)",
      slug: "amano-shrimp-5",
      sku: "SHRIMP-AM-5-001",
      description: "Amano Shrimp are the best algae-eating shrimp available. Named after the famous aquascaper Takashi Amano, they are essential for planted tanks.",
      shortDescription: "The ultimate algae-eating shrimp",
      price: 349,
      stockQuantity: 35,
      stockStatus: "IN_STOCK",
      categoryId: shrimpCat.id,
      isLivestock: true,
      livestockData: JSON.stringify({
        minTemp: 20,
        maxTemp: 28,
        minPh: 6.5,
        maxPh: 7.5,
        difficulty: "BEGINNER",
      }),
      expressOnly: true,
      shippingRestricted: true,
      allowedPincodes: JSON.stringify(["Mumbai", "Delhi", "Bangalore", "Hyderabad"]),
    },

    // Equipment
    {
      name: "LED Aquarium Light Pro 60cm",
      slug: "led-light-pro-60cm",
      sku: "EQUIP-LED-60-001",
      description: "Professional-grade LED light for planted aquariums. Features adjustable brightness, color temperature, and timer function. Perfect for tanks up to 60cm.",
      shortDescription: "Professional LED light for planted tanks",
      price: 2499,
      compareAtPrice: 2999,
      stockQuantity: 18,
      stockStatus: "IN_STOCK",
      categoryId: equipCat.id,
      isFeatured: true,
    },
    {
      name: "Canister Filter CF-400",
      slug: "canister-filter-cf400",
      sku: "EQUIP-FIL-CF400-001",
      description: "Powerful and silent canister filter suitable for tanks up to 400 liters. Includes all filter media and easy-to-use quick disconnect valves.",
      shortDescription: "Powerful canister filter for large tanks",
      price: 4999,
      compareAtPrice: 5999,
      stockQuantity: 10,
      stockStatus: "IN_STOCK",
      categoryId: equipCat.id,
    },
    {
      name: "CO2 System Complete Kit",
      slug: "co2-system-complete",
      sku: "EQUIP-CO2-KIT-001",
      description: "Complete CO2 system including regulator, solenoid, bubble counter, diffuser, and tubing. Everything you need for a planted tank.",
      shortDescription: "Complete CO2 injection system",
      price: 3999,
      stockQuantity: 8,
      stockStatus: "IN_STOCK",
      categoryId: equipCat.id,
    },
    {
      name: "Aquarium Heater 100W",
      slug: "aquarium-heater-100w",
      sku: "EQUIP-HTR-100-001",
      description: "Reliable submersible heater with adjustable temperature control. Suitable for tanks 50-100 liters. Features auto shut-off protection.",
      shortDescription: "Reliable submersible heater",
      price: 699,
      stockQuantity: 40,
      stockStatus: "IN_STOCK",
      categoryId: equipCat.id,
    },
    {
      name: "Air Pump Silent Pro",
      slug: "air-pump-silent-pro",
      sku: "EQUIP-AIR-SP-001",
      description: "Ultra-silent air pump for tanks up to 200 liters. Multiple outlets for running multiple sponge filters or air stones.",
      shortDescription: "Ultra-silent air pump",
      price: 449,
      stockQuantity: 55,
      stockStatus: "IN_STOCK",
      categoryId: equipCat.id,
    },

    // Food
    {
      name: "Premium Tropical Flakes 100g",
      slug: "tropical-flakes-100g",
      sku: "FOOD-FLK-100-001",
      description: "High-quality tropical fish flakes with natural color enhancers. Suitable for all tropical fish species.",
      shortDescription: "Premium flakes for tropical fish",
      price: 299,
      stockQuantity: 100,
      stockStatus: "IN_STOCK",
      categoryId: foodCat.id,
    },
    {
      name: "Betta Pellets Premium 50g",
      slug: "betta-pellets-50g",
      sku: "FOOD-BET-50-001",
      description: "Specially formulated pellets for Betta fish. Enhances color and promotes health with natural ingredients.",
      shortDescription: "Premium pellets for Betta fish",
      price: 199,
      stockQuantity: 75,
      stockStatus: "IN_STOCK",
      categoryId: foodCat.id,
    },
    {
      name: "Shrimp Food Complete 50g",
      slug: "shrimp-food-complete",
      sku: "FOOD-SHR-50-001",
      description: "Complete nutrition for freshwater shrimp. Contains essential minerals and vitamins for healthy molting and growth.",
      shortDescription: "Complete nutrition for shrimp",
      price: 249,
      stockQuantity: 60,
      stockStatus: "IN_STOCK",
      categoryId: foodCat.id,
    },
  ];

  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });

    // Add product images
    await prisma.productImage.upsert({
      where: { id: `img-${created.id}` },
      update: {},
      create: {
        id: `img-${created.id}`,
        productId: created.id,
        url: getProductImage(product.categoryId!, product.name),
        alt: product.name,
        sortOrder: 0,
      },
    });
  }

  // Create coupons
  await prisma.coupon.upsert({
    where: { code: "AQUA10" },
    update: {},
    create: {
      code: "AQUA10",
      description: "10% off your first order",
      type: "PERCENTAGE",
      value: 10,
      minOrderValue: 500,
      maxDiscount: 200,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "FREESHIP" },
    update: {},
    create: {
      code: "FREESHIP",
      description: "Free shipping on orders over ₹999",
      type: "FREE_SHIPPING",
      value: 0,
      minOrderValue: 999,
      isActive: true,
    },
  });

  // Create test user
  await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      password: "$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u", // "password123"
      firstName: "Test",
      lastName: "User",
      phone: "9876543210",
      role: "CUSTOMER",
    },
  });

  // Create admin user
  await prisma.user.upsert({
    where: { email: "admin@aqua.store" },
    update: {},
    create: {
      email: "admin@aqua.store",
      password: "$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u", // "password123"
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    },
  });

  await seedMenusAndPages();

  console.log("Database seeded successfully!");
}

function getProductImage(categoryId: string, productName: string): string {
  // Using picsum.photos for reliable placeholder images
  const images: Record<string, string[]> = {
    fish: [
      "https://picsum.photos/seed/fish1/800/800",
      "https://picsum.photos/seed/fish2/800/800",
      "https://picsum.photos/seed/fish3/800/800",
    ],
    plants: [
      "https://picsum.photos/seed/plant1/800/800",
      "https://picsum.photos/seed/plant2/800/800",
    ],
    shrimp: [
      "https://picsum.photos/seed/shrimp1/800/800",
    ],
    equipment: [
      "https://picsum.photos/seed/equip1/800/800",
    ],
    food: [
      "https://picsum.photos/seed/food1/800/800",
    ],
  };

  if (productName.toLowerCase().includes("betta")) {
    return "https://picsum.photos/seed/betta/800/800";
  }
  if (productName.toLowerCase().includes("tetra")) {
    return "https://picsum.photos/seed/tetra/800/800";
  }
  if (productName.toLowerCase().includes("shrimp")) {
    return "https://picsum.photos/seed/shrimp/800/800";
  }
  if (productName.toLowerCase().includes("plant") || productName.toLowerCase().includes("fern") || productName.toLowerCase().includes("anubias") || productName.toLowerCase().includes("sword") || productName.toLowerCase().includes("monte")) {
    return images.plants[Math.floor(Math.random() * images.plants.length)];
  }

  return images.fish[Math.floor(Math.random() * images.fish.length)];
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
