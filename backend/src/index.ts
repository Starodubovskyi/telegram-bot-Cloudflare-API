import { connectMongo } from "./db/mongo";
import { env } from "./config/env";
import { createTelegramBot } from "./modules/bot/telegram.bot";
import { createApp } from "./app";

// Здесь собираем всё вместе: Mongo, бот, Express.
async function bootstrap(): Promise<void> {
  await connectMongo();

  const bot = createTelegramBot();
  await bot.launch();

  const app = createApp(bot);

  app.listen(env.port, () => {
    console.log(`Backend started on port ${env.port}`);
  });

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
