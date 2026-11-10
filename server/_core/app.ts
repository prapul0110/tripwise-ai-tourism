import express, { type Express } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";

export function createTripWiseApp(): Express {
  const app = express();

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Storage proxy
  registerStorageProxy(app);

  // Path normalization: if a serverless proxy stripped the /api prefix, restore it
  // This guarantees /api/trpc matches without introducing an extra public endpoint
  app.use((req, _res, next) => {
    if (!req.url.startsWith("/api") && req.url.startsWith("/trpc")) {
      req.url = `/api${req.url}`;
    }
    next();
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}
