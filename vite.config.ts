import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";
import { handleCopilotAction, CopilotError } from "./src/lib/ai/copilot.gateway";

// Reject request bodies larger than this to bound memory + upstream cost.
const MAX_BODY_BYTES = 256 * 1024;

function copilotDevApi(): Plugin {
  let apiKey = "";

  return {
    name: "copilot-dev-api",
    configResolved(config) {
      const env = loadEnv(config.mode, process.cwd(), "");
      apiKey = env.AI_GATEWAY_API_KEY || process.env.AI_GATEWAY_API_KEY || "";
    },
    configureServer(server) {
      server.middlewares.use("/api", async (req, res, next) => {
        const action = req.url?.replace(/^\/+/, "").split("?")[0] ?? "";
        if (!action) return next();

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        const isDiagnostic = action === "diagnostic";
        if (req.method !== "POST" && !(req.method === "GET" && isDiagnostic)) {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "method not allowed" }));
          return;
        }

        try {
          const body =
            req.method === "POST"
              ? await new Promise<unknown>((resolve, reject) => {
                  let raw = "";
                  let bytes = 0;
                  let tooLarge = false;
                  req.setEncoding("utf8");
                  req.on("data", (chunk: string) => {
                    if (tooLarge) return;
                    bytes += Buffer.byteLength(chunk, "utf8");
                    if (bytes > MAX_BODY_BYTES) {
                      tooLarge = true;
                      reject(new CopilotError("payload too large", 413));
                      return;
                    }
                    raw += chunk;
                  });
                  req.on("end", () => {
                    if (tooLarge) return;
                    try {
                      resolve(raw ? JSON.parse(raw) : {});
                    } catch {
                      reject(new CopilotError("invalid JSON body", 400));
                    }
                  });
                  req.on("error", reject);
                })
              : {};

          const payload = await handleCopilotAction(action, body, { apiKey });
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.end(JSON.stringify(payload));
        } catch (error) {
          const status = error instanceof CopilotError ? error.status : 502;
          const code = error instanceof CopilotError ? error.code : undefined;
          const message =
            error instanceof CopilotError && status !== 502
              ? error.message
              : "copilot upstream failure";
          if (!(error instanceof CopilotError)) {
            server.config.logger.error(
              `[copilot] ${error instanceof Error ? error.message : String(error)}`,
            );
          }
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.end(JSON.stringify(code ? { error: message, code } : { error: message }));
        }
      });
    },
  };
}

export default defineConfig({
  base: "/",
  plugins: [
    copilotDevApi(),
    TanStackRouterVite({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
      // strip the leading `_workspace` segment so /_workspace/index → /
      // (already handled by TSR layout-route convention; nothing custom needed)
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  server: {
    port: 5173,
    host: true,
  },
});
