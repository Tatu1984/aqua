import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createToken, UserRole } from "@/lib/auth";
import { exchangeFacebookCode, getFacebookUserInfo } from "@/lib/oauth";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("Facebook OAuth error:", error);
      return redirectWithError("oauth_denied");
    }

    if (!code || !state) {
      return redirectWithError("missing_params");
    }

    // Verify state cookie
    const storedState = request.cookies.get("oauth_state")?.value;
    if (!storedState || storedState !== state) {
      return redirectWithError("invalid_state");
    }

    // Decode state to get redirect URL
    let redirectPath = "/";
    try {
      const decodedState = JSON.parse(Buffer.from(state, "base64").toString());
      redirectPath = decodedState.redirect || "/";
    } catch {
      // Use default redirect
    }

    // Exchange code for tokens
    const tokens = await exchangeFacebookCode(code);

    // Get user info from Facebook
    const facebookUser = await getFacebookUserInfo(tokens.access_token);

    if (!facebookUser.email) {
      return redirectWithError("no_email");
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: facebookUser.email },
    });

    if (user) {
      // Update OAuth info if user exists but signed up differently
      if (!user.authProvider) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            authProvider: "facebook",
            authProviderId: facebookUser.id,
            emailVerified: true,
            avatar: user.avatar || facebookUser.avatar,
            lastLoginAt: new Date(),
          },
        });
      } else {
        // Just update last login
        user = await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: facebookUser.email,
          firstName: facebookUser.firstName,
          lastName: facebookUser.lastName,
          avatar: facebookUser.avatar,
          emailVerified: true,
          authProvider: "facebook",
          authProviderId: facebookUser.id,
          lastLoginAt: new Date(),
        },
      });
    }

    // Generate JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    // Redirect to frontend with auth cookie
    const response = NextResponse.redirect(new URL(redirectPath, FRONTEND_URL));

    // Clear OAuth state cookie
    response.cookies.delete("oauth_state");

    // Set auth cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Facebook OAuth callback error:", error);
    return redirectWithError("server_error");
  }
}

function redirectWithError(errorCode: string): NextResponse {
  const errorUrl = new URL("/login", FRONTEND_URL);
  errorUrl.searchParams.set("error", errorCode);
  return NextResponse.redirect(errorUrl.toString());
}
