import { Router, type Request, type Response } from "express";
import { Telegraf, type Context } from "telegraf";

type BotInstance = Telegraf<Context>;

function getRequestIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0];
  }

  return req.ip || req.socket.remoteAddress || "unknown";
}

function safeJson(data: unknown): string {
  try {
    return JSON.stringify(data);
  } catch {
    return "[unserializable]";
  }
}

async function notifyTelegram(
    bot: BotInstance,
    chatId: string,
    text: string
): Promise<void> {
  try {
    await bot.telegram.sendMessage(chatId, text);
  } catch (err) {
    // В проде можно отправить в отдельный логгер
    console.error("Failed to send webhook notification to Telegram", err);
  }
}

export function createWebhookRouter(bot: BotInstance, chatId: string): Router {
  const router = Router();

  router.get("/test", async (req: Request, res: Response) => {
    const ip = getRequestIp(req);

    await notifyTelegram(
        bot,
        chatId,
        `GET /webhook/test\nIP: ${ip}\nQuery: ${safeJson(req.query)}`
    );

    res.json({ ok: true });
  });

  router.post("/test", async (req: Request, res: Response) => {
    const ip = getRequestIp(req);

    await notifyTelegram(
        bot,
        chatId,
        `POST /webhook/test\nIP: ${ip}\nBody: ${safeJson(req.body)}`
    );

    res.json({ ok: true });
  });

  return router;
}
