import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.paymentStatus = status;
    }

    const [orders, total, stats, refunds] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          paymentStatus: true,
          paymentMethod: true,
          razorpayPaymentId: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: "PAID" },
      }),
      prisma.refund.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" },
      }),
    ]);

    return NextResponse.json({
      payments: orders,
      total,
      totalPages: Math.ceil(total / limit),
      totalRevenue: stats._sum.total || 0,
      totalRefunds: refunds._sum.amount || 0,
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
