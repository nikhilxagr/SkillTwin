import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pino from "pino";
import { healthResponseSchema } from "@skilltwin/contracts";
import { config } from "./config.js";

export const app = express();
const logger = pino();

app.use(helmet());
app.use(cors({ origin: config.WEB_ORIGIN }));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));
app.use((request, _response, next) => {
  logger.info({ method: request.method, path: request.path }, "request");
  next();
});

app.get("/health", (_request, response) => {
  response.json(
    healthResponseSchema.parse({
      status: "ok",
      service: "skilltwin-api",
      timestamp: new Date().toISOString(),
    }),
  );
});

app.use((_request, response) => {
  response.status(404).json({ error: "Not found" });
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  logger.error(error);
  response.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);
