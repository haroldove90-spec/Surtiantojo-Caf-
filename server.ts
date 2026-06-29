import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  
  // Hostinger (and other cloud environments) assigns a dynamic port via process.env.PORT.
  // For AI Studio's reverse proxy, we default to 3000.
  const PORT = process.env.PORT || 3000;
  const listenTarget = isNaN(Number(PORT)) ? PORT : Number(PORT);

  // Simple health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", environment: process.env.NODE_ENV || "development" });
  });

  // Integrate Vite middleware in development mode, otherwise serve static dist files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (typeof listenTarget === "number") {
    app.listen(listenTarget, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${listenTarget}`);
    });
  } else {
    app.listen(listenTarget, () => {
      console.log(`Server running on Unix socket: ${listenTarget}`);
    });
  }
}

startServer();
