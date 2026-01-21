import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: "up" | "down";
      latency?: number;
      error?: string;
    };
    memory: {
      status: "ok" | "warning" | "critical";
      used: number;
      total: number;
      percentage: number;
    };
  };
}

// Track server start time
const startTime = Date.now();

export async function GET() {
  const healthStatus: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: {
      database: { status: "down" },
      memory: { status: "ok", used: 0, total: 0, percentage: 0 },
    },
  };

  // Check database connectivity
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.checks.database = {
      status: "up",
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    healthStatus.checks.database = {
      status: "down",
      error: error instanceof Error ? error.message : "Unknown error",
    };
    healthStatus.status = "unhealthy";
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const usedMemory = memoryUsage.heapUsed;
  const totalMemory = memoryUsage.heapTotal;
  const memoryPercentage = (usedMemory / totalMemory) * 100;

  healthStatus.checks.memory = {
    status: memoryPercentage > 90 ? "critical" : memoryPercentage > 75 ? "warning" : "ok",
    used: Math.round(usedMemory / 1024 / 1024), // MB
    total: Math.round(totalMemory / 1024 / 1024), // MB
    percentage: Math.round(memoryPercentage),
  };

  if (healthStatus.checks.memory.status === "critical") {
    healthStatus.status = healthStatus.status === "unhealthy" ? "unhealthy" : "degraded";
  }

  // Return appropriate status code
  const statusCode = healthStatus.status === "healthy" ? 200 : healthStatus.status === "degraded" ? 200 : 503;

  return NextResponse.json(healthStatus, { status: statusCode });
}

// HEAD request for simple health check (used by load balancers)
export async function HEAD() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
