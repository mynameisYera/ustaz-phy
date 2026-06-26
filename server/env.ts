import dotenv from "dotenv";

// On Vercel (and other production hosts), env vars come from the platform.
// Only load .env file in development.
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env.local", override: true });
  dotenv.config({ path: ".env", override: false }); // fallback
}

export function getEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}
