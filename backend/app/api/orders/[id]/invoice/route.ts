import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Generate invoice HTML (can be converted to PDF using browser print or a PDF library)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        shippingAddress: true,
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const formatPrice = (price: number) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
      }).format(price);

    const formatDate = (date: Date) =>
      new Intl.DateTimeFormat("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);

    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${order.orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; line-height: 1.5; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .logo { font-size: 32px; font-weight: bold; color: #0ea5e9; }
    .invoice-info { text-align: right; }
    .invoice-info h1 { font-size: 24px; margin-bottom: 8px; }
    .invoice-info p { color: #666; }
    .addresses { display: flex; gap: 40px; margin-bottom: 40px; }
    .address { flex: 1; }
    .address h3 { font-size: 14px; color: #666; margin-bottom: 8px; text-transform: uppercase; }
    .address p { margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
    th { text-align: left; padding: 12px; background: #f8f9fa; border-bottom: 2px solid #e5e7eb; font-weight: 600; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .text-right { text-align: right; }
    .totals { width: 300px; margin-left: auto; }
    .totals tr td { padding: 8px 0; border: none; }
    .totals tr.total { border-top: 2px solid #1a1a1a; font-weight: bold; font-size: 18px; }
    .footer { margin-top: 60px; text-align: center; color: #666; font-size: 14px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .status-paid { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef3c7; color: #92400e; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .container { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Aqua</div>
      <div class="invoice-info">
        <h1>INVOICE</h1>
        <p><strong>Invoice #:</strong> ${order.orderNumber}</p>
        <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
        <p>
          <span class="status ${order.paymentStatus === "PAID" ? "status-paid" : "status-pending"}">
            ${order.paymentStatus}
          </span>
        </p>
      </div>
    </div>

    <div class="addresses">
      <div class="address">
        <h3>From</h3>
        <p><strong>Aqua Store</strong></p>
        <p>123 Aquarium Street</p>
        <p>Mumbai, Maharashtra 400001</p>
        <p>India</p>
        <p>GSTIN: 27XXXXX1234X1Z5</p>
      </div>
      <div class="address">
        <h3>Bill To</h3>
        ${
          order.shippingAddress
            ? `
          <p><strong>${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</strong></p>
          <p>${order.shippingAddress.addressLine1}</p>
          ${order.shippingAddress.addressLine2 ? `<p>${order.shippingAddress.addressLine2}</p>` : ""}
          <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
          <p>Phone: ${order.shippingAddress.phone}</p>
        `
            : `<p>${order.email}</p>`
        }
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>SKU</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${order.items
          .map(
            (item) => `
          <tr>
            <td>${item.name}</td>
            <td>${item.sku}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatPrice(item.price)}</td>
            <td class="text-right">${formatPrice(item.total)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <table class="totals">
      <tr>
        <td>Subtotal</td>
        <td class="text-right">${formatPrice(order.subtotal)}</td>
      </tr>
      ${
        order.discount > 0
          ? `
      <tr>
        <td>Discount${order.couponCode ? ` (${order.couponCode})` : ""}</td>
        <td class="text-right">-${formatPrice(order.discount)}</td>
      </tr>
      `
          : ""
      }
      <tr>
        <td>Shipping</td>
        <td class="text-right">${order.shippingCost === 0 ? "FREE" : formatPrice(order.shippingCost)}</td>
      </tr>
      ${
        order.tax > 0
          ? `
      <tr>
        <td>Tax (GST)</td>
        <td class="text-right">${formatPrice(order.tax)}</td>
      </tr>
      `
          : ""
      }
      <tr class="total">
        <td>Total</td>
        <td class="text-right">${formatPrice(order.total)}</td>
      </tr>
    </table>

    <div class="footer">
      <p>Thank you for shopping with Aqua!</p>
      <p>For any queries, contact us at support@aqua.store</p>
    </div>
  </div>
  <script>
    // Auto print when opened
    if (window.location.search.includes('print=true')) {
      window.print();
    }
  </script>
</body>
</html>
    `;

    return new NextResponse(invoiceHtml, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Invoice generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
