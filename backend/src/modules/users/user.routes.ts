import { Router, type Request, type Response } from "express";
import { User, type UserDocument } from "./user.model";
import { adminAuth } from "../../middleware/adminAuth";

export const userRouter = Router();

userRouter.use(adminAuth);

type CreateUserBody = {
  username?: string;
  telegramId?: number;
};

// Список пользователей, у которых есть доступ к боту.
userRouter.get("/", async (_req: Request, res: Response) => {
  const users = await User.find().sort({ createdAt: -1 }).lean<UserDocument[]>();
  res.json(users);
});

// Добавить нового пользователя (по username или telegramId).
userRouter.post("/", async (req: Request<unknown, unknown, CreateUserBody>, res: Response) => {
  const { username, telegramId } = req.body;

  if (!username && !telegramId) {
    res.status(400).json({ message: "username or telegramId required" });
    return;
  }

  let normalizedUsername: string | undefined;
  if (username) {
    normalizedUsername = username.startsWith("@") ? username.slice(1) : username;
  }

  try {
    const existing = await User.findOne({
      $or: [
        telegramId ? { telegramId } : null,
        normalizedUsername ? { username: normalizedUsername } : null
      ].filter(Boolean)
    });

    if (existing) {
      res.status(409).json({ message: "user already exists in whitelist" });
      return;
    }

    const user = await User.create({ username: normalizedUsername, telegramId });
    res.status(201).json(user);
  } catch (err) {
    console.error("Error creating user", err);
    res.status(500).json({ message: "failed to create user" });
  }
});

// Удалить пользователя из whitelist.
userRouter.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: "user not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting user", err);
    res.status(500).json({ message: "failed to delete user" });
  }
});
