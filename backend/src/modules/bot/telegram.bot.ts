import { Telegraf, Context } from "telegraf";
import { env } from "../../config/env";
import { User } from "../users/user.model";
import { Domain } from "../domains/domain.model";
import {
  createZone,
  createDnsRecord,
  deleteDnsRecord,
  DnsRecordPayload,
  getZoneByName,
  updateDnsRecord
} from "../cloudflare/cloudflare.service";

type BotContext = Context & {
  message?: {
    text?: string;
  };
};

type DomainLean = {
  name: string;
  zoneId: string;
  ns: string[];
  ownerTelegramId?: number;
};

type CommandHandler = (ctx: BotContext) => Promise<void>;

async function isUserAllowed(ctx: BotContext): Promise<boolean> {
  const from = ctx.from;
  if (!from) {
    return false;
  }

  const username = from.username || "";

  const user = await User.findOne({
    $or: [{ telegramId: from.id }, { username }]
  });

  if (!user) {
    await ctx.reply("У вас нет доступа к этому боту. Напишите администратору.");
    return false;
  }

  return true;
}

function withAccess(handler: CommandHandler): CommandHandler {
  return async (ctx) => {
    if (!(await isUserAllowed(ctx))) {
      return;
    }
    await handler(ctx);
  };
}

function getArgs(ctx: BotContext): string[] {
  const text = ctx.message?.text || "";
  const parts = text.trim().split(/\s+/);
  // первый элемент — /команда, дальше только аргументы
  return parts.slice(1);
}

async function resolveZoneId(domain: string): Promise<string | null> {
  const fromApi = await getZoneByName(domain);
  if (fromApi) {
    return fromApi;
  }

  const fromDb = await Domain.findOne({ name: domain }).lean<DomainLean | null>();
  if (fromDb) {
    return fromDb.zoneId;
  }

  return null;
}

export function createTelegramBot(): Telegraf<BotContext> {
  const bot = new Telegraf<BotContext>(env.telegramToken);

  // Ограничение по чату. В личке бот доступен, но только для whitelist-пользователей.
  bot.use(async (ctx, next) => {
    const chat = ctx.chat;
    if (!chat) {
      return;
    }

    const chatId = String(chat.id);

    if (chat.type === "private") {
      await next();
      return;
    }

    if (chatId !== env.allowedChatId) {
      return;
    }

    await next();
  });

  bot.start(
      withAccess(async (ctx) => {
        await ctx.reply(
            "Привет! Я бот для управления Cloudflare.\n" +
            "Команды:\n" +
            "/register_domain example.com — создать домен\n" +
            "/dns_add example.com A 1.2.3.4 — добавить DNS запись\n" +
            "/dns_update zoneId recordId A 5.6.7.8 — обновить запись\n" +
            "/dns_delete zoneId recordId — удалить запись\n" +
            "/domains — список доменов\n" +
            "/help — показать команды ещё раз"
        );
      })
  );

  bot.command(
      "help",
      withAccess(async (ctx) => {
        await ctx.reply(
            "Команды:\n" +
            "/register_domain example.com\n" +
            "/dns_add example.com A 1.2.3.4\n" +
            "/dns_update zoneId recordId A 5.6.7.8\n" +
            "/dns_delete zoneId recordId\n" +
            "/domains — список доменов"
        );
      })
  );

  bot.command(
      "register_domain",
      withAccess(async (ctx) => {
        const [domain] = getArgs(ctx);

        if (!domain) {
          await ctx.reply("Использование: /register_domain example.com");
          return;
        }

        try {
          const existingZoneId = await getZoneByName(domain);
          if (existingZoneId) {
            await ctx.reply(`Домен уже есть в Cloudflare. Zone ID: ${existingZoneId}`);
            return;
          }

          const zone = await createZone(domain);

          await Domain.create({
            name: domain,
            zoneId: zone.id,
            ns: zone.nameServers,
            ownerTelegramId: ctx.from?.id
          });

          await ctx.reply(
              `Домен зарегистрирован.\n` +
              `Zone ID: ${zone.id}\n` +
              `NS записи:\n${zone.nameServers.join("\n")}`
          );
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
          await ctx.reply(`Ошибка при регистрации домена: ${msg}`);
        }
      })
  );

  bot.command(
      "dns_add",
      withAccess(async (ctx) => {
        const [domain, type, content] = getArgs(ctx);

        if (!domain || !type || !content) {
          await ctx.reply("Использование: /dns_add example.com A 1.2.3.4");
          return;
        }

        try {
          const zoneId = await resolveZoneId(domain);
          if (!zoneId) {
            await ctx.reply("Zone для этого домена не найдена. Сначала зарегистрируйте домен.");
            return;
          }

          const payload: DnsRecordPayload = {
            type,
            name: domain,
            content,
            ttl: 1,
            proxied: false
          };

          const record = await createDnsRecord(zoneId, payload);

          await ctx.reply(`DNS запись создана.\nZone ID: ${zoneId}\nRecord ID: ${record.id}`);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
          await ctx.reply(`Ошибка при создании DNS записи: ${msg}`);
        }
      })
  );

  bot.command(
      "dns_update",
      withAccess(async (ctx) => {
        const [zoneId, recordId, type, content] = getArgs(ctx);

        if (!zoneId || !recordId || !type || !content) {
          await ctx.reply("Использование: /dns_update zoneId recordId A 5.6.7.8");
          return;
        }

        try {
          const payload: Partial<DnsRecordPayload> = { type, content };
          const record = await updateDnsRecord(zoneId, recordId, payload);

          await ctx.reply(`DNS запись обновлена.\nZone ID: ${zoneId}\nRecord ID: ${record.id}`);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
          await ctx.reply(`Ошибка при обновлении DNS записи: ${msg}`);
        }
      })
  );

  bot.command(
      "dns_delete",
      withAccess(async (ctx) => {
        const [zoneId, recordId] = getArgs(ctx);

        if (!zoneId || !recordId) {
          await ctx.reply("Использование: /dns_delete zoneId recordId");
          return;
        }

        try {
          await deleteDnsRecord(zoneId, recordId);
          await ctx.reply(`DNS запись удалена.\nZone ID: ${zoneId}\nRecord ID: ${recordId}`);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
          await ctx.reply(`Ошибка при удалении DNS записи: ${msg}`);
        }
      })
  );

  bot.command(
      "domains",
      withAccess(async (ctx) => {
        const domains = await Domain.find()
            .sort({ createdAt: -1 })
            .lean<DomainLean[]>();

        if (!domains.length) {
          await ctx.reply("Пока нет зарегистрированных доменов.");
          return;
        }

        const lines = domains.map((d) => `• ${d.name} (zoneId: ${d.zoneId})`);
        await ctx.reply(`Зарегистрированные домены:\n${lines.join("\n")}`);
      })
  );

  return bot;
}
