import multer from "multer";
import { config } from "../config";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes },
});
