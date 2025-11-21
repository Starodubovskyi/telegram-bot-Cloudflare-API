import express from "express";
import cors from "cors";
import { Telegraf } from "telegraf";
import { env } from "./config/env";
import { userRouter } from "./modules/users/user.routes";
import { createWebhookRouter } from "./modules/webhooks/webhook.routes";

export function createApp(bot: Telegraf) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/users", userRouter);
  app.use("/webhook", createWebhookRouter(bot, env.allowedChatId));

  app.get("/", (_req: any, res: { json: (arg0: { ok: boolean; message: string; }) => void; }) => {
    res.json({ ok: true, message: "Cloudflare Telegram Bot API" });
  });

  return app;
}
