import express from "express";
import cors from "cors";
import { config, structurerMode } from "./config";
import { healthRouter } from "./routes/health";
import { documentsRouter } from "./routes/documents";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/", healthRouter);
app.use("/api/documents", documentsRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[ttg-doc-standardizer] listening on :${config.port} ` +
      `(env=${config.nodeEnv}, structuring=${structurerMode})`
  );
});
