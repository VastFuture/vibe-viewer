import * as esbuild from "esbuild";
import { cpSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import prompts from "prompts";
import { stat } from "node:fs/promises";

const distDir = "dist";
const publicDir = resolve(distDir, "public");

// Clean dist
rmSync(distDir, { recursive: true, force: true });

const nodeCommon = {
  bundle: true,
  minify: false,
  sourcemap: true,
  format: "esm",
  platform: "node",
  target: "node18",
  external: ["chokidar", "express", "open", "prompts", "ws"],
  logLevel: "info",
};

const clientOpts = {
  bundle: true,
  minify: false,
  sourcemap: true,
  format: "esm",
  splitting: true,
  platform: "browser",
  target: "es2020",
  outdir: publicDir,
  entryPoints: ["src/client/app.tsx"],
  outbase: "src/client",
  tsconfig: "tsconfig.json",
  jsx: "automatic",
  logLevel: "info",
};

function copyAssets() {
  cpSync("src/client/index.html", resolve(publicDir, "index.html"));
  cpSync("src/client/style.css", resolve(publicDir, "style.css"));
  const katexSrc = resolve("node_modules/katex/dist");
  try { cpSync(katexSrc, resolve(publicDir, "katex"), { recursive: true }); } catch {}
  const shikiSrc = resolve("node_modules/shiki/dist");
  try { cpSync(shikiSrc, resolve(publicDir, "shiki"), { recursive: true }); } catch {}
}

// ---- Initial build ----
await Promise.all([
  esbuild.build({
    ...nodeCommon,
    entryPoints: ["src/cli.ts"],
    outfile: "dist/cli.js",
    banner: { js: "#!/usr/bin/env node" },
  }),
  esbuild.build({
    ...nodeCommon,
    entryPoints: ["src/server/index.ts"],
    outfile: "dist/server.js",
  }),
  esbuild.build(clientOpts),
]);
copyAssets();
console.log("Build complete.\n");

// ---- Start watch contexts (auto-rebuild) ----
await Promise.all([
  esbuild.context({
    ...nodeCommon,
    entryPoints: ["src/cli.ts"],
    outfile: "dist/cli.js",
    banner: { js: "#!/usr/bin/env node" },
  }).then((ctx) => ctx.watch()),
  esbuild.context({
    ...nodeCommon,
    entryPoints: ["src/server/index.ts"],
    outfile: "dist/server.js",
  }).then((ctx) => ctx.watch()),
  esbuild.context(clientOpts).then((ctx) => ctx.watch()),
]);
console.log("Watching source files (auto-rebuild on change)...\n");

// ---- Pick directory ----
const args = process.argv.slice(2);
let dirArg = args[0];
if (!dirArg) {
  const ans = await prompts(
    {
      type: "text",
      name: "dir",
      message: "选择要浏览的目录（支持相对路径，默认当前目录）",
      initial: process.cwd(),
      validate: async (value) => {
        try {
          const st = await stat(value.trim() ? resolve(process.cwd(), value) : process.cwd());
          return st.isDirectory() ? true : "不是目录";
        } catch {
          return "目录不存在";
        }
      },
    },
    { onCancel: () => process.exit(1) },
  );
  dirArg = ans.dir?.trim() || ".";
}

// ---- Server start ----
const server = spawn("node", ["dist/cli.js", "--dir", dirArg, "--no-open"], {
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env },
});

server.stdout.on("data", (data) => {
  process.stdout.write(data);
});

server.stderr.on("data", (data) => {
  process.stderr.write(data);
});

server.on("exit", (code) => {
  console.log(`\n[dev] Server stopped (code ${code}).`);
  console.log("[dev] Press Ctrl+C to exit.\n");
});

// ---- Shutdown ----
process.on("SIGINT", () => {
  console.log("\n[dev] Shutting down...");
  server.kill("SIGTERM");
  process.exit(0);
});
process.on("SIGTERM", () => {
  server.kill("SIGTERM");
  process.exit(0);
});

console.log("Ctrl+C to stop  |  Client changes = browser refresh  |  Server changes = restart dev\n");
