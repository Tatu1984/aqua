import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Default email templates
const DEFAULT_TEMPLATES: Record<string, { subject: string; bodyHtml: string }> = {
  order_confirmation: {
    subject: "Order Confirmed - {{orderNumber}}",
    bodyHtml: `
      <h1>Thank you for your order!</h1>
      <p>Hi {{customerName}},</p>
      <p>Your order <strong>{{orderNumber}}</strong> has been confirmed.</p>
      <h2>Order Details</h2>
      {{orderItems}}
      <p><strong>Subtotal:</strong> {{subtotal}}</p>
      <p><strong>Shipping:</strong> {{shippingCost}}</p>
      <p><strong>Total:</strong> {{total}}</p>
      <p>We'll notify you when your order ships.</p>
    `,
  },
  order_processing: {
    subject: "Your Order is Being Processed - {{orderNumber}}",
    bodyHtml: `
      <h1>We're preparing your order!</h1>
      <p>Hi {{customerName}},</p>
      <p>Great news! Your order <strong>{{orderNumber}}</strong> is now being processed.</p>
      <p>We'll send you another email when your order ships.</p>
    `,
  },
  order_shipped: {
    subject: "Your Order Has Shipped - {{orderNumber}}",
    bodyHtml: `
      <h1>Your order is on its way!</h1>
      <p>Hi {{customerName}},</p>
      <p>Your order <strong>{{orderNumber}}</strong> has been shipped.</p>
      {{#trackingNumber}}
      <p><strong>Tracking Number:</strong> {{trackingNumber}}</p>
      <p><a href="{{trackingUrl}}">Track your package</a></p>
      {{/trackingNumber}}
    `,
  },
  order_delivered: {
    subject: "Order Delivered - {{orderNumber}}",
    bodyHtml: `
      <h1>Your order has been delivered!</h1>
      <p>Hi {{customerName}},</p>
      <p>Your order <strong>{{orderNumber}}</strong> has been delivered.</p>
      <p>We hope you love your purchase! Please leave a review.</p>
    `,
  },
  order_cancelled: {
    subject: "Order Cancelled - {{orderNumber}}",
    bodyHtml: `
      <h1>Your order has been cancelled</h1>
      <p>Hi {{customerName}},</p>
      <p>Your order <strong>{{orderNumber}}</strong> has been cancelled.</p>
      <p>If you didn't request this cancellation, please contact us.</p>
    `,
  },
  order_refunded: {
    subject: "Refund Processed - {{orderNumber}}",
    bodyHtml: `
      <h1>Your refund has been processed</h1>
      <p>Hi {{customerName}},</p>
      <p>A refund of <strong>{{refundAmount}}</strong> for order <strong>{{orderNumber}}</strong> has been processed.</p>
      <p>The amount will be credited to your original payment method within 5-7 business days.</p>
    `,
  },
  customer_note: {
    subject: "A Note About Your Order - {{orderNumber}}",
    bodyHtml: `
      <h1>A message about your order</h1>
      <p>Hi {{customerName}},</p>
      <p>We have an update about your order <strong>{{orderNumber}}</strong>:</p>
      <blockquote>{{noteContent}}</blockquote>
    `,
  },
  password_reset: {
    subject: "Reset Your Password",
    bodyHtml: `
      <h1>Password Reset Request</h1>
      <p>Hi {{customerName}},</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="{{resetUrl}}">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
    `,
  },
  welcome: {
    subject: "Welcome to Aqua Store!",
    bodyHtml: `
      <h1>Welcome to Aqua Store!</h1>
      <p>Hi {{customerName}},</p>
      <p>Thank you for creating an account with us.</p>
      <p>Explore our collection of aquarium fish, plants, and equipment.</p>
    `,
  },
  low_stock_alert: {
    subject: "Low Stock Alert - {{productName}}",
    bodyHtml: `
      <h1>Low Stock Alert</h1>
      <p>Product <strong>{{productName}}</strong> (SKU: {{sku}}) is running low on stock.</p>
      <p>Current quantity: <strong>{{stockQuantity}}</strong></p>
      <p>Low stock threshold: <strong>{{lowStockThreshold}}</strong></p>
    `,
  },
  review_approved: {
    subject: "Your Review Has Been Published",
    bodyHtml: `
      <h1>Thank you for your review!</h1>
      <p>Hi {{customerName}},</p>
      <p>Your review for <strong>{{productName}}</strong> has been approved and published.</p>
    `,
  },
};

// GET - List all email templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (name) {
      const template = await prisma.emailTemplate.findUnique({
        where: { name },
      });

      if (template) {
        return NextResponse.json({ template });
      }

      // Return default if not customized
      if (DEFAULT_TEMPLATES[name]) {
        return NextResponse.json({
          template: {
            name,
            ...DEFAULT_TEMPLATES[name],
            isDefault: true,
          },
        });
      }

      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Return all templates
    const customTemplates = await prisma.emailTemplate.findMany({
      orderBy: { name: "asc" },
    });

    const customMap = new Map(customTemplates.map((t) => [t.name, t]));

    const templates = Object.keys(DEFAULT_TEMPLATES).map((name) => {
      const custom = customMap.get(name);
      if (custom) {
        return { ...custom, isDefault: false };
      }
      return {
        name,
        ...DEFAULT_TEMPLATES[name],
        isDefault: true,
        isActive: true,
      };
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Get email templates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    );
  }
}

// POST - Create or update template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, subject, bodyHtml, bodyText, isActive } = body;

    if (!name || !subject || !bodyHtml) {
      return NextResponse.json(
        { error: "Name, subject, and bodyHtml are required" },
        { status: 400 }
      );
    }

    const template = await prisma.emailTemplate.upsert({
      where: { name },
      create: {
        name,
        subject,
        bodyHtml,
        bodyText,
        isActive: isActive !== false,
      },
      update: {
        subject,
        bodyHtml,
        bodyText,
        isActive,
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Save email template error:", error);
    return NextResponse.json(
      { error: "Failed to save email template" },
      { status: 500 }
    );
  }
}
