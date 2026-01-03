import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - List activity logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get activity logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}

// POST - Create activity log (can also be called from other APIs)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      action,
      entityType,
      entityId,
      description,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
    } = body;

    if (!action || !entityType) {
      return NextResponse.json(
        { error: "Action and entityType are required" },
        { status: 400 }
      );
    }

    const log = await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        description,
        oldValues,
        newValues,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error("Create activity log error:", error);
    return NextResponse.json(
      { error: "Failed to create activity log" },
      { status: 500 }
    );
  }
}

// DELETE - Clear old logs
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const olderThanDays = parseInt(searchParams.get("olderThanDays") || "90");

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Deleted ${result.count} logs older than ${olderThanDays} days`,
    });
  } catch (error) {
    console.error("Delete activity logs error:", error);
    return NextResponse.json(
      { error: "Failed to delete activity logs" },
      { status: 500 }
    );
  }
}
