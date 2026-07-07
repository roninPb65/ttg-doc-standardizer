import { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof MulterError) {
    res.status(400).json({ error: `Upload error: ${err.message}` });
    return;
  }
  const message = err instanceof Error ? err.message : "Unexpected server error";
  // eslint-disable-next-line no-console
  console.error("[error]", err);
  res.status(500).json({ error: message });
}
