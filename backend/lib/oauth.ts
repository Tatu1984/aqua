/**
 * OAuth configuration and utilities
 */

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  emailVerified?: boolean;
}

// Google OAuth configuration
export function getGoogleConfig(): OAuthConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  return { clientId, clientSecret, redirectUri };
}

// Facebook OAuth configuration
export function getFacebookConfig(): OAuthConfig {
  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI ||
    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/facebook/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Facebook OAuth credentials not configured');
  }

  return { clientId, clientSecret, redirectUri };
}

// Google OAuth URLs
export function getGoogleAuthUrl(state: string): string {
  const config = getGoogleConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Exchange Google auth code for tokens
export async function exchangeGoogleCode(code: string): Promise<{
  access_token: string;
  id_token: string;
}> {
  const config = getGoogleConfig();

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange Google code: ${error}`);
  }

  return response.json();
}

// Get Google user info
export async function getGoogleUserInfo(accessToken: string): Promise<OAuthUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get Google user info');
  }

  const data = await response.json();

  return {
    id: data.id,
    email: data.email,
    firstName: data.given_name,
    lastName: data.family_name,
    avatar: data.picture,
    emailVerified: data.verified_email,
  };
}

// Facebook OAuth URLs
export function getFacebookAuthUrl(state: string): string {
  const config = getFacebookConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'email,public_profile',
    state,
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

// Exchange Facebook auth code for tokens
export async function exchangeFacebookCode(code: string): Promise<{
  access_token: string;
}> {
  const config = getFacebookConfig();

  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
  });

  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange Facebook code: ${error}`);
  }

  return response.json();
}

// Get Facebook user info
export async function getFacebookUserInfo(accessToken: string): Promise<OAuthUserInfo> {
  const params = new URLSearchParams({
    fields: 'id,email,first_name,last_name,picture.type(large)',
    access_token: accessToken,
  });

  const response = await fetch(`https://graph.facebook.com/v18.0/me?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to get Facebook user info');
  }

  const data = await response.json();

  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    avatar: data.picture?.data?.url,
    emailVerified: true, // Facebook verifies emails
  };
}

// Generate a random state for CSRF protection
export function generateOAuthState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
