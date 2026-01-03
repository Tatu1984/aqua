import { prisma } from "./db";

// Email service abstraction - integrates with various providers
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Template variable replacement
function replaceVariables(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;

  // Handle simple {{variable}} replacement
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, value?.toString() || "");
  }

  // Handle conditional {{#variable}} ... {{/variable}} blocks
  for (const [key, value] of Object.entries(variables)) {
    const conditionalRegex = new RegExp(
      `{{#${key}}}([\\s\\S]*?){{/${key}}}`,
      "g"
    );
    if (value) {
      result = result.replace(conditionalRegex, "$1");
    } else {
      result = result.replace(conditionalRegex, "");
    }
  }

  return result;
}

// Get email template with defaults
async function getEmailTemplate(templateName: string): Promise<{
  subject: string;
  bodyHtml: string;
  bodyText?: string;
} | null> {
  // Try to get custom template
  const template = await prisma.emailTemplate.findUnique({
    where: { name: templateName },
  });

  if (template && template.isActive) {
    return {
      subject: template.subject,
      bodyHtml: template.bodyHtml,
      bodyText: template.bodyText || undefined,
    };
  }

  // Return null if no template found (caller should handle defaults)
  return null;
}

// Get email settings
async function getEmailSettings(): Promise<{
  fromName: string;
  fromEmail: string;
  headerImage?: string;
  footerText: string;
  baseColor: string;
}> {
  const settings = await prisma.setting.findMany({
    where: { group: "email" },
  });

  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    const key = s.key.replace("email.", "");
    try {
      settingsMap[key] = JSON.parse(s.value);
    } catch {
      settingsMap[key] = s.value;
    }
  }

  return {
    fromName: settingsMap.fromName || "Aqua Store",
    fromEmail: settingsMap.fromEmail || "noreply@aquastore.com",
    headerImage: settingsMap.headerImage,
    footerText: settingsMap.footerText || "Thank you for shopping with Aqua Store!",
    baseColor: settingsMap.baseColor || "#0ea5e9",
  };
}

// Wrap content in email layout
function wrapInLayout(
  content: string,
  settings: Awaited<ReturnType<typeof getEmailSettings>>
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: ${settings.baseColor}; padding: 24px; text-align: center; }
    .header img { max-height: 60px; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 32px 24px; }
    .content h1 { color: #18181b; margin-top: 0; }
    .content p { color: #3f3f46; line-height: 1.6; }
    .content a { color: ${settings.baseColor}; }
    .button { display: inline-block; background: ${settings.baseColor}; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0; }
    .footer { padding: 24px; text-align: center; font-size: 14px; color: #71717a; border-top: 1px solid #e4e4e7; }
    blockquote { background: #f4f4f5; padding: 16px; border-left: 4px solid ${settings.baseColor}; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${settings.headerImage ? `<img src="${settings.headerImage}" alt="Logo">` : `<h1>Aqua Store</h1>`}
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>${settings.footerText}</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Log email
async function logEmail(
  to: string,
  subject: string,
  template: string | null,
  status: "SENT" | "FAILED",
  error?: string,
  metadata?: any
): Promise<void> {
  try {
    await prisma.emailLog.create({
      data: {
        to,
        subject,
        template,
        status,
        error,
        metadata,
      },
    });
  } catch (e) {
    console.error("Failed to log email:", e);
  }
}

// Main send email function
export async function sendEmail(
  to: string,
  templateName: string,
  variables: Record<string, any>
): Promise<SendEmailResult> {
  try {
    const template = await getEmailTemplate(templateName);

    if (!template) {
      console.warn(`Email template "${templateName}" not found`);
      return { success: false, error: "Template not found" };
    }

    const settings = await getEmailSettings();

    const subject = replaceVariables(template.subject, variables);
    const bodyContent = replaceVariables(template.bodyHtml, variables);
    const html = wrapInLayout(bodyContent, settings);
    const text = template.bodyText
      ? replaceVariables(template.bodyText, variables)
      : undefined;

    // TODO: Integrate with actual email provider (Resend, SendGrid, etc.)
    // For now, we just log the email
    console.log(`📧 Email would be sent to: ${to}`);
    console.log(`   Subject: ${subject}`);

    // In production, you would use:
    // - Resend: await resend.emails.send({ from, to, subject, html, text })
    // - SendGrid: await sgMail.send({ to, from, subject, html, text })
    // - Nodemailer: await transporter.sendMail({ to, from, subject, html, text })

    await logEmail(to, subject, templateName, "SENT", undefined, { variables });

    return { success: true, messageId: `mock_${Date.now()}` };
  } catch (error: any) {
    console.error("Send email error:", error);
    await logEmail(to, "", templateName, "FAILED", error.message);
    return { success: false, error: error.message };
  }
}

// Convenience functions for common emails
export async function sendOrderConfirmation(
  order: any,
  customerEmail: string,
  customerName: string
): Promise<SendEmailResult> {
  const orderItemsHtml = order.items
    .map(
      (item: any) =>
        `<tr><td>${item.name}</td><td>${item.quantity}</td><td>₹${item.price.toFixed(2)}</td></tr>`
    )
    .join("");

  return sendEmail(customerEmail, "order_confirmation", {
    customerName,
    orderNumber: order.orderNumber,
    orderItems: `<table><thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead><tbody>${orderItemsHtml}</tbody></table>`,
    subtotal: `₹${order.subtotal.toFixed(2)}`,
    shippingCost: order.shippingCost === 0 ? "FREE" : `₹${order.shippingCost.toFixed(2)}`,
    total: `₹${order.total.toFixed(2)}`,
  });
}

export async function sendOrderShipped(
  order: any,
  customerEmail: string,
  customerName: string,
  trackingNumber?: string,
  trackingUrl?: string
): Promise<SendEmailResult> {
  return sendEmail(customerEmail, "order_shipped", {
    customerName,
    orderNumber: order.orderNumber,
    trackingNumber,
    trackingUrl,
  });
}

export async function sendOrderStatusUpdate(
  order: any,
  customerEmail: string,
  customerName: string,
  newStatus: string
): Promise<SendEmailResult> {
  const templateMap: Record<string, string> = {
    PROCESSING: "order_processing",
    SHIPPED: "order_shipped",
    DELIVERED: "order_delivered",
    CANCELLED: "order_cancelled",
    REFUNDED: "order_refunded",
  };

  const templateName = templateMap[newStatus];
  if (!templateName) {
    return { success: false, error: "No template for status" };
  }

  return sendEmail(customerEmail, templateName, {
    customerName,
    orderNumber: order.orderNumber,
  });
}

export async function sendLowStockAlert(
  product: any,
  adminEmail: string
): Promise<SendEmailResult> {
  return sendEmail(adminEmail, "low_stock_alert", {
    productName: product.name,
    sku: product.sku,
    stockQuantity: product.stockQuantity,
    lowStockThreshold: product.lowStockThreshold,
  });
}
