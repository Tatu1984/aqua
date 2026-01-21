/**
 * Environment variable validation
 * This module validates required environment variables on startup
 */

interface EnvConfig {
  required: string[];
  optional: string[];
}

const envConfig: EnvConfig = {
  required: [
    "DATABASE_URL",
    "JWT_SECRET",
  ],
  optional: [
    "DIRECT_URL",
    "FRONTEND_URL",
    "JWT_EXPIRES_IN",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
    "NODE_ENV",
  ],
};

interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validate environment variables
 */
export function validateEnv(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const key of envConfig.required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Check optional variables and warn if missing
  for (const key of envConfig.optional) {
    if (!process.env[key]) {
      warnings.push(`Optional env var ${key} is not set`);
    }
  }

  // Security warnings
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push("JWT_SECRET should be at least 32 characters for security");
  }

  if (process.env.NODE_ENV === "production") {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      warnings.push("Payment gateway credentials not set for production");
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Initialize and validate environment on startup
 * Call this early in your application bootstrap
 */
export function initEnv(): void {
  const result = validateEnv();

  // Log warnings
  for (const warning of result.warnings) {
    console.warn(`[ENV WARNING] ${warning}`);
  }

  // Throw error if required vars are missing
  if (!result.valid) {
    const errorMessage = `Missing required environment variables: ${result.missing.join(", ")}`;
    console.error(`[ENV ERROR] ${errorMessage}`);
    throw new Error(errorMessage);
  }

  console.log("[ENV] Environment validation passed");
}

/**
 * Get typed environment variables with defaults
 */
export const env = {
  get NODE_ENV() {
    return process.env.NODE_ENV || "development";
  },
  get isProduction() {
    return this.NODE_ENV === "production";
  },
  get isDevelopment() {
    return this.NODE_ENV === "development";
  },
  get DATABASE_URL() {
    return process.env.DATABASE_URL!;
  },
  get JWT_SECRET() {
    return process.env.JWT_SECRET!;
  },
  get JWT_EXPIRES_IN() {
    return process.env.JWT_EXPIRES_IN || "7d";
  },
  get FRONTEND_URL() {
    return process.env.FRONTEND_URL || "http://localhost:3000";
  },
  get RAZORPAY_KEY_ID() {
    return process.env.RAZORPAY_KEY_ID || "";
  },
  get RAZORPAY_KEY_SECRET() {
    return process.env.RAZORPAY_KEY_SECRET || "";
  },
  get RAZORPAY_WEBHOOK_SECRET() {
    return process.env.RAZORPAY_WEBHOOK_SECRET || "";
  },
};
