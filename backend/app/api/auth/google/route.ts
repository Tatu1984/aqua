import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl, generateOAuthState } from "@/lib/oauth";

// Redirect to Google OAuth
export async function GET(request: NextRequest) {
  try {
    // Get redirect URL from query params (where to go after login)
    const { searchParams } = new URL(request.url);
    const redirect = searchParams.get("redirect") || "/";

    // Generate state with embedded redirect URL
    const state = JSON.stringify({
      csrf: generateOAuthState(),
      redirect,
    });

    // Encode state as base64
    const encodedState = Buffer.from(state).toString("base64");

    const authUrl = getGoogleAuthUrl(encodedState);

    // Set state cookie for CSRF verification
    const response = NextResponse.redirect(authUrl);
    response.cookies.set("oauth_state", encodedState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Google OAuth init error:", error);

    // Redirect to login with error
    const errorUrl = new URL("/login", process.env.FRONTEND_URL || "http://localhost:3000");
    errorUrl.searchParams.set("error", "oauth_config_error");
    return NextResponse.redirect(errorUrl.toString());
  }
}
