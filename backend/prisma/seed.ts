import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
