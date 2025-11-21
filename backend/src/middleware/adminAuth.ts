import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

// Простая проверка admin key через заголовок X-Admin-Key.
export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers["x-admin-key"];
  if (!apiKey || apiKey !== env.adminApiKey) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  next();
}
