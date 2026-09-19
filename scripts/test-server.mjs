#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import { startServer } from "../dist/server.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootAbs = path.resolve(__dirname, "..");

console.log("--- Running vibeview integration self-tests ---");

const { port, close } = await startServer({ rootAbs });
const baseUrl = `http://127.0.0.1:${port}`;

try {
  // Test 1: /api/config GET
  const configRes = await fetch(`${baseUrl}/api/config`);
  assert.equal(configRes.status, 200, "/api/config should return 200");
  const config = await configRes.json();
  assert.ok(Array.isArray(config.extensions), "extensions should be array");
  assert.ok(config.extensions.includes(".md"), "extensions should include .md");
  assert.ok(config.extensions.includes(".html"), "extensions should include .html");
  assert.ok(config.extensions.includes(".png"), "extensions should include .png");
  console.log("✓ Test 1 passed: /api/config returned valid defaults (including .html and .png)");

  // Test 2: /api/tree GET includes markdown, png, svg
  const treeRes = await fetch(`${baseUrl}/api/tree`);
  assert.equal(treeRes.status, 200, "/api/tree should return 200");
  const tree = await treeRes.json();
  assert.equal(tree.rootAbs, rootAbs);
  
  function findItem(items, name) {
    for (const it of items) {
      if (it.name === name) return it;
      if (it.children) {
        const sub = findItem(it.children, name);
        if (sub) return sub;
      }
    }
    return null;
  }

  const mdItem = findItem(tree.items, "README.md");
  assert.ok(mdItem, "Tree should contain README.md");
  const pngItem = findItem(tree.items, "roadmap-timeline.png");
  assert.ok(pngItem, "Tree should contain roadmap-timeline.png");
  console.log("✓ Test 2 passed: /api/tree successfully listed markdown and image files");

  // Test 3: /api/file GET for Markdown file
  const mdFileRes = await fetch(`${baseUrl}/api/file?path=${encodeURIComponent(mdItem.absPath)}`);
  assert.equal(mdFileRes.status, 200);
  const mdFile = await mdFileRes.json();
  assert.equal(mdFile.fileType, "markdown");
  assert.ok(mdFile.content.length > 0, "Markdown content should not be empty");
  console.log("✓ Test 3 passed: /api/file correctly identified and read Markdown file");

  // Test 4: /api/file GET for Image file
  const imgFileRes = await fetch(`${baseUrl}/api/file?path=${encodeURIComponent(pngItem.absPath)}`);
  assert.equal(imgFileRes.status, 200);
  const imgFile = await imgFileRes.json();
  assert.equal(imgFile.fileType, "image");
  assert.equal(imgFile.content, "", "Image file should not return utf8 string content");
  assert.ok(imgFile.size > 0, "Image size should be > 0");
  console.log("✓ Test 4 passed: /api/file correctly handled Image file without memory bloat");

  // Test 5: /raw endpoint for image
  const rawRes = await fetch(`${baseUrl}/raw?path=${encodeURIComponent(pngItem.absPath)}`);
  assert.equal(rawRes.status, 200);
  const rawBlob = await rawRes.blob();
  assert.ok(rawBlob.size > 0);
  console.log("✓ Test 5 passed: /raw endpoint streamed image data correctly");

  // Test 6: Create a temp HTML file and test reading it
  const tempHtmlPath = path.join(rootAbs, "temp_test_preview.html");
  await fs.writeFile(tempHtmlPath, "<!doctype html><h1>Test HTML</h1>", "utf8");
  try {
    const htmlFileRes = await fetch(`${baseUrl}/api/file?path=${encodeURIComponent(tempHtmlPath)}`);
    assert.equal(htmlFileRes.status, 200);
    const htmlFile = await htmlFileRes.json();
    assert.equal(htmlFile.fileType, "html");
    assert.ok(htmlFile.content.includes("Test HTML"));
    console.log("✓ Test 6 passed: HTML file detected and read with fileType='html'");
  } finally {
    await fs.unlink(tempHtmlPath).catch(() => {});
  }

  // Test 7: /api/config POST dynamic extension update
  const updateRes = await fetch(`${baseUrl}/api/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ extensions: ".md, .customext" }),
  });
  assert.equal(updateRes.status, 200);
  const updatedConfig = await updateRes.json();
  assert.ok(updatedConfig.extensions.includes(".customext"));
  assert.ok(!updatedConfig.extensions.includes(".html"), "HTML should be excluded after narrowing down extensions");
  console.log("✓ Test 7 passed: /api/config POST dynamically updated extensions");

  console.log("\n🎉 ALL SELF-TESTS PASSED SUCCESSFULLY!");
} finally {
  await close();
}
