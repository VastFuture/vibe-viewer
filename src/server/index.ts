import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { buildTree, readMarkdownFile, isMarkdownPath, DEFAULT_EXTENSIONS } from "./api.js";
import { createWatcher } from "./watcher.js";

interface ServerOpts {
  rootAbs: string;
  theme: string;
  extensions?: string[];
}

export async function startServer({ rootAbs, theme, extensions }: ServerOpts) {
  const rootNorm = path.resolve(rootAbs);
  const exts = extensions?.length ? extensions : [...DEFAULT_EXTENSIONS];

  const distDir = path.dirname(fileURLToPath(import.meta.url));
  const publicDir = path.join(distDir, "public");

  const app = express();
  const server = http.createServer(app);

  const sockets = new Set<import("node:net").Socket>();
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });

  const wss = new WebSocketServer({ server, path: "/ws" });
  const clients = new Set<WebSocket>();

  function broadcast(msg: Record<string, unknown>) {
    const s = JSON.stringify(msg);
    console.log(`[ws] broadcast ${msg.type} → ${clients.size} clients`);
    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) ws.send(s);
    }
  }

  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log(`[ws] client connected (${clients.size} total)`);
    ws.on("close", () => {
      clients.delete(ws);
      console.log(`[ws] client disconnected (${clients.size} remaining)`);
    });
  });

  const watcher = createWatcher({ rootAbs: rootNorm, extensions: exts, broadcast });

  app.get("/api/config", (_req, res) => {
    res.json({
      theme,
      rootAbs: rootNorm,
      rootName: path.basename(rootNorm),
      extensions: exts,
    });
  });

  app.get("/api/tree", async (_req, res) => {
    try {
      const tree = await buildTree(rootNorm, exts);
      res.json(tree);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get("/api/file", async (req, res) => {
    const p = String(req.query.path ?? "");
    if (!p) return res.status(400).json({ error: "缺少 path 参数" });

    const absPath = path.resolve(p);
    if (!isMarkdownPath(absPath, exts))
      return res.status(400).json({ error: "仅支持 Markdown 文件" });

    try {
      const file = await readMarkdownFile(absPath, rootNorm, exts);
      watcher.addFile(absPath);
      res.json(file);
    } catch (err) {
      res.status(404).json({ error: String(err) });
    }
  });

  app.get("/raw", async (req, res) => {
    const p = String(req.query.path ?? "");
    if (!p) return res.status(400).send("缺少 path 参数");

    const absPath = path.resolve(p);
    if (!path.isAbsolute(absPath)) return res.status(400).send("path 必须是绝对路径");

    try {
      await fs.access(absPath);
    } catch {
      return res.status(404).send("文件不存在");
    }

    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(absPath);
  });

  app.use(express.static(publicDir));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;

  return {
    port,
    async close() {
      await watcher.close();
      try { wss.close(); } catch {}
      for (const ws of clients) {
        try { ws.terminate(); } catch {}
      }
      clients.clear();
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
        for (const s of sockets) {
          try { s.destroy(); } catch {}
        }
      });
    },
  };
}
