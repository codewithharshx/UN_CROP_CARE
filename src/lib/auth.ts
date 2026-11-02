import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "../../drizzle/schema";

const isProduction = process.env.NODE_ENV === "production";
const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

// Detect if Google OAuth credentials are provided
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const isGoogleConfigured = Boolean(googleClientId && googleClientSecret);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET || "uncropcare_fallback_secret_must_be_set_in_env_32chars!",
  baseURL,
  appName: "UN CROP CARE",

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  socialProviders: isGoogleConfigured
    ? {
        google: {
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
        },
      }
    : {},

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: isGoogleConfigured ? ["google"] : [],
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes cache
    },
  },

  advanced: {
    cookiePrefix: "uncc",
    useSecureCookies: isProduction,
  },

  rateLimit: {
    enabled: true,
    window: 60, // 60 seconds
    max: 30, // 30 requests per minute
  },
});

export { isGoogleConfigured };

