import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const page = await prisma.page.findUnique({
      where: { slug },
    });

    if (!page || page.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        content: page.content,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        template: page.template,
      },
    });
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}
