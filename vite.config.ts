import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";
import { handleCopilotAction } from "./src/lib/ai/copilot.gateway";

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

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "method not allowed" }));
          return;
        }

        try {
          const body = await new Promise<unknown>((resolve, reject) => {
            let raw = "";
            req.setEncoding("utf8");
            req.on("data", (chunk: string) => {
              raw += chunk;
            });
            req.on("end", () => {
              try {
                resolve(raw ? JSON.parse(raw) : {});
              } catch (error) {
                reject(error);
              }
            });
            req.on("error", reject);
          });

          const payload = await handleCopilotAction(action, body, { apiKey });
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(payload));
        } catch (error) {
          const message = error instanceof Error ? error.message : "copilot upstream failure";
          server.config.logger.error(`[copilot] ${message}`);
          res.statusCode = message.startsWith("Unknown copilot action") ? 404 : 502;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}

export default defineConfig({
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
