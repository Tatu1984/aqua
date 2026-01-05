import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://aqua-frontend-psi.vercel.app",
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const isAllowedOrigin = allowedOrigins.includes(origin);

  // Handle preflight OPTIONS request
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 200 });

    if (isAllowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "GET, DELETE, PATCH, POST, PUT, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
    );
    response.headers.set("Access-Control-Max-Age", "86400");

    return response;
  }

  // Handle actual request
  const response = NextResponse.next();

  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET, DELETE, PATCH, POST, PUT, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
