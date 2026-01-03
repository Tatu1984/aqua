import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "")
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    const { event: eventType, payload } = event;

    switch (eventType) {
      case "payment.captured":
        const paymentId = payload.payment.entity.id;
        const orderId = payload.payment.entity.order_id;

        // Find order by razorpay order ID and update
        await prisma.order.updateMany({
          where: { razorpayOrderId: orderId },
          data: {
            paymentStatus: "PAID",
            status: "PROCESSING",
            razorpayPaymentId: paymentId,
            paidAt: new Date(),
          },
        });
        break;

      case "payment.failed":
        const failedOrderId = payload.payment.entity.order_id;
        await prisma.order.updateMany({
          where: { razorpayOrderId: failedOrderId },
          data: {
            paymentStatus: "FAILED",
          },
        });
        break;

      case "refund.created":
        const refundOrderId = payload.refund.entity.payment_id;
        // Handle refund logic
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
