import { Router } from "express";
import { pool } from "../db";
import { structurerMode } from "../config";

export const healthRouter = Router();

healthRouter.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

healthRouter.get("/readyz", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ready", db: "ok", structurer: structurerMode });
  } catch (e) {
    res.status(503).json({ status: "not-ready", db: "unavailable" });
  }
});
