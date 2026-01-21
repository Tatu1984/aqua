import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// CSRF token store (in-memory)
// For production with multiple instances, use Redis
const csrfTokens = new Map<string, { token: string; expires: number }>();

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (now > value.expires) {
      csrfTokens.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

const CSRF_TOKEN_HEADER = "x-csrf-token";
const CSRF_COOKIE_NAME = "csrf-token";
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a new CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Get or create CSRF token for a session
 */
export function getOrCreateCsrfToken(sessionId: string): string {
  const existing = csrfTokens.get(sessionId);
  const now = Date.now();

  if (existing && now < existing.expires) {
    return existing.token;
  }

  const token = generateCsrfToken();
  csrfTokens.set(sessionId, {
    token,
    expires: now + TOKEN_EXPIRY_MS,
  });

  return token;
}

/**
 * Validate CSRF token from request
 */
export function validateCsrfToken(
  request: NextRequest,
  sessionId: string
): boolean {
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  const stored = csrfTokens.get(sessionId);

  if (!headerToken || !stored) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (headerToken.length !== stored.token.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < headerToken.length; i++) {
    result |= headerToken.charCodeAt(i) ^ stored.token.charCodeAt(i);
  }

  return result === 0 && Date.now() < stored.expires;
}

/**
 * Get session ID from request (use auth token or generate one)
 */
export function getSessionId(request: NextRequest): string {
  // Use auth token as session identifier if present
  const authToken = request.cookies.get("auth-token")?.value;
  if (authToken) {
    // Hash the auth token to use as session ID
    return crypto.createHash("sha256").update(authToken).digest("hex");
  }

  // Use CSRF cookie as session identifier for unauthenticated users
  const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (csrfCookie) {
    return csrfCookie;
  }

  // Generate new session ID
  return crypto.randomBytes(16).toString("hex");
}

/**
 * CSRF protection middleware
 * Should be applied to state-changing requests (POST, PUT, PATCH, DELETE)
 */
export function checkCsrf(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase();

  // Only check CSRF for state-changing methods
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return null;
  }

  const sessionId = getSessionId(request);

  // Skip CSRF for webhook endpoints (they use signature verification)
  const pathname = request.nextUrl.pathname;
  if (pathname.includes("/webhook")) {
    return null;
  }

  // Skip CSRF for login/register (they don't have a session yet)
  if (
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/register"
  ) {
    return null;
  }

  // Validate CSRF token
  if (!validateCsrfToken(request, sessionId)) {
    return NextResponse.json(
      { error: "Invalid or missing CSRF token" },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Add CSRF token to response
 */
export function addCsrfToResponse(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const sessionId = getSessionId(request);
  const token = getOrCreateCsrfToken(sessionId);

  // Set CSRF token in response header (for JS to read)
  response.headers.set("x-csrf-token", token);

  // Also set as cookie for session persistence
  const existingCsrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!existingCsrfCookie) {
    response.cookies.set(CSRF_COOKIE_NAME, sessionId, {
      httpOnly: false, // JS needs to read this
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });
  }

  return response;
}
