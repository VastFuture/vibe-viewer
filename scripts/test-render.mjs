#!/usr/bin/env node
// Render regression tests using jsdom + the actual markdown pipeline.
// Usage: node scripts/test-render.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const fixturesDir = path.join(root, "fixtures");
const snapDir = path.join(fixturesDir, "__snapshots__");

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
(globalThis as any).window = dom.window;
(globalThis as any).document = dom.window.document;
(globalThis as any).HTMLElement = dom.window.HTMLElement;

const { startServer } = await import(path.join(root, "dist", "server.js"));

console.log("Placeholder: Add actual render test logic here");
console.log("See fixtures/*.md and fixtures/__snapshots__/*.html");
