import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Get single template by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Get email template error:", error);
    return NextResponse.json(
      { error: "Failed to fetch email template" },
      { status: 500 }
    );
  }
}

// PUT - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { subject, bodyHtml, bodyText, isActive } = body;

    const existing = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        subject,
        bodyHtml,
        bodyText,
        isActive,
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Update email template error:", error);
    return NextResponse.json(
      { error: "Failed to update email template" },
      { status: 500 }
    );
  }
}

// DELETE - Reset template to default
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    await prisma.emailTemplate.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Template reset to default" });
  } catch (error) {
    console.error("Delete email template error:", error);
    return NextResponse.json(
      { error: "Failed to reset email template" },
      { status: 500 }
    );
  }
}
