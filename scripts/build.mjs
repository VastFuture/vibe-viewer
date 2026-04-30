import * as esbuild from "esbuild";
import { cpSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const isDev = process.argv.includes("--dev");
const isWatch = process.argv.includes("--watch");
const distDir = "dist";
const publicDir = resolve(distDir, "public");

if (!isWatch) {
  rmSync(distDir, { recursive: true, force: true });
}

const commonNode = {
  bundle: true,
  minify: !isDev,
  sourcemap: true,
  format: "esm",
  platform: "node",
  target: "node18",
  external: ["chokidar", "express", "open", "prompts", "ws"],
  logLevel: "info",
};

const clientOpts = {
  bundle: true,
  minify: !isDev,
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
  const katexDst = resolve(publicDir, "katex");
  try { cpSync(katexSrc, katexDst, { recursive: true }); } catch {}
  const shikiSrc = resolve("node_modules/shiki/dist");
  const shikiDst = resolve(publicDir, "shiki");
  try { cpSync(shikiSrc, shikiDst, { recursive: true }); } catch {}
}

if (isWatch) {
  // Watch mode: rebuild on source changes
  const cliCtx = await esbuild.context({
    ...commonNode,
    entryPoints: ["src/cli.ts"],
    outfile: "dist/cli.js",
    banner: { js: "#!/usr/bin/env node" },
  });
  const serverCtx = await esbuild.context({
    ...commonNode,
    entryPoints: ["src/server/index.ts"],
    outfile: "dist/server.js",
  });
  const clientCtx = await esbuild.context(clientOpts);

  copyAssets();

  await Promise.all([cliCtx.watch(), serverCtx.watch(), clientCtx.watch()]);
  console.log("Watching for changes... (Ctrl+C to stop)");
} else {
  await Promise.all([
    esbuild.build({
      ...commonNode,
      entryPoints: ["src/cli.ts"],
      outfile: "dist/cli.js",
      banner: { js: "#!/usr/bin/env node" },
    }),
    esbuild.build({
      ...commonNode,
      entryPoints: ["src/server/index.ts"],
      outfile: "dist/server.js",
    }),
    esbuild.build(clientOpts),
  ]);
  copyAssets();
  const { chmodSync } = await import("node:fs");
  chmodSync(resolve(distDir, "cli.js"), 0o755);
  console.log("Build complete.");
}
