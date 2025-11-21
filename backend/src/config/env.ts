import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

export const env = {
  telegramToken: requireEnv("TELEGRAM_BOT_TOKEN"),
  allowedChatId: requireEnv("TELEGRAM_ALLOWED_CHAT_ID"),
  mongoUri: requireEnv("MONGODB_URI"),
  cloudflareToken: requireEnv("CLOUDFLARE_API_TOKEN"),
  cloudflareAccountId: requireEnv("CLOUDFLARE_ACCOUNT_ID"),
  cloudflareBase: process.env.CLOUDFLARE_API_BASE || "https://api.cloudflare.com/client/v4",
  adminApiKey: requireEnv("ADMIN_API_KEY"),
  port: Number(process.env.PORT || 3000)
};
