#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";
import { startServer } from "../dist/server.js";

const fixture = `# D2 Browser E2E

\`\`\`d2
client: Browser
server: vibeview
renderer: D2 CLI
client -> server: POST /api/render/d2
server -> renderer: stdin
renderer -> server: SVG
server -> client: sanitized SVG
\`\`\`

\`\`\`d2
this is invalid: {
\`\`\`
`;

const chromeCandidates = [
  process.env.CHROME_BIN,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);
let executablePath;
for (const candidate of chromeCandidates) {
  try {
    await fs.access(candidate);
    executablePath = candidate;
    break;
  } catch {}
}
assert.ok(executablePath, "Chrome/Chromium not found; set CHROME_BIN");
const rootAbs = await fs.mkdtemp(path.join(os.tmpdir(), "vibeview-d2-e2e-"));
let server;
let browser;
try {
  await fs.writeFile(path.join(rootAbs, "d2-browser-e2e.md"), fixture, "utf8");
  server = await startServer({ rootAbs });
  browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const responses = [];
  page.on("response", (response) => {
    if (response.url().endsWith("/api/render/d2")) responses.push(response.status());
  });

  await page.goto(`http://127.0.0.1:${server.port}/`, { waitUntil: "networkidle" });
  await page.getByText("d2-browser-e2e.md", { exact: true }).click();

  await page.locator(".bm-diagram").waitFor();
  await page.getByText("D2 渲染失败：", { exact: false }).waitFor();
  assert.equal(await page.locator(".bm-diagram").count(), 1, "valid D2 block should render one diagram");
  assert.ok(await page.locator(".bm-diagram svg").count() >= 1, "valid D2 diagram should contain SVG");
  assert.equal(await page.locator(".bm-error").count(), 1, "invalid D2 block should render one local error");
  assert.deepEqual(responses.sort((a, b) => a - b), [200, 422], "browser should exercise real success and error APIs");

  await page.locator(".bm-diagram").click();
  const fullscreenImage = page.getByAltText("图表全屏预览");
  await fullscreenImage.waitFor();
  await page.getByTitle("放大 (+)").click();
  await page.locator(".img-viewer__zoom-label", { hasText: "125%" }).waitFor();
  await page.keyboard.press("Escape");
  await fullscreenImage.waitFor({ state: "detached" });

  console.log("✓ Browser E2E passed: D2 SVG, local error, fullscreen, zoom, and Escape close");
} finally {
  await browser?.close();
  await server?.close();
  await fs.rm(rootAbs, { recursive: true, force: true });
}
