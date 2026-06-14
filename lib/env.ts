import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_CHAT_MODEL: z.string().default("gpt-5-mini"),
  OPENAI_EMBED_MODEL: z.string().default("text-embedding-3-small"),
  RESEND_API_KEY: z.string().optional(),
  CONTACT_NOTIFICATION_EMAIL: z.string().email().optional(),
  ADMIN_EMAILS: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export const featureFlags = {
  firebase: Boolean(env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS),
  clerk: Boolean(env.CLERK_SECRET_KEY && env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
  openai: Boolean(env.OPENAI_API_KEY),
  email: Boolean(env.RESEND_API_KEY && env.CONTACT_NOTIFICATION_EMAIL),
} as const;

export function requireEnv(name: keyof typeof env) {
  const value = env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}
