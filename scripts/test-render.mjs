#!/usr/bin/env node
import assert from "node:assert/strict";
import MarkdownIt from "markdown-it";
import mdAnchor from "markdown-it-anchor";
import taskLists from "markdown-it-task-lists";
import { full as emoji } from "markdown-it-emoji";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import * as esbuild from "esbuild";
import { unlinkSync } from "node:fs";
import { resolve } from "node:path";

console.log("--- Running Markdown & Security render pipeline tests ---");

// 1. 原有基础 Markdown 渲染测试
const md = new MarkdownIt({ html: true, linkify: true, typographer: true })
  .use(mdAnchor)
  .use(taskLists, { enabled: true })
  .use(emoji);

const sampleMd = `# Hello World
This is a test of **markdown** parsing.

\`\`\`ts
const x: number = 42;
\`\`\`

- [x] Task 1
- [ ] Task 2

> Note: this is a blockquote
`;

const rendered = md.render(sampleMd);
assert.ok(rendered.includes("<h1"), "Rendered output should include h1");
assert.ok(rendered.includes("Hello World"), "Rendered output should include header text");
assert.ok(rendered.includes("task-list-item"), "Rendered output should support task lists");

const window = new JSDOM("").window;
const purify = DOMPurify(window);
const sanitized = purify.sanitize(rendered);
assert.ok(sanitized.length > 0, "Sanitized output should be non-empty");

console.log("✓ Basic markdown pipeline passed");

// 2. 项目真实 renderMarkdown 与 D2 支持测试
console.log("--- Testing project real renderMarkdown & D2 fenced blocks ---");

const tmpFile = resolve("scripts/.tmp-client-bundle.mjs");
await esbuild.build({
  entryPoints: ["src/client/markdown.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: tmpFile,
  packages: "external",
});

const { renderMarkdown } = await import(tmpFile);
unlinkSync(tmpFile);

const defaultSettings = {
  theme: "github-light",
  securityLevel: "allow-all",
  breaks: false,
  emoji: true,
  math: true,
  autoLocate: true,
  extensions: ".md",
};

// 2.1 Mermaid 回归测试
const mermaidMd = `\`\`\`mermaid
graph TD;
  A-->B;
\`\`\``;
const mermaidHtml = renderMarkdown(mermaidMd, { settings: defaultSettings, highlighter: null });
assert.ok(
  mermaidHtml.includes('<div class="mermaid">'),
  "Mermaid fence must be wrapped in <div class=\"mermaid\">",
);

// 2.2 D2 fenced 代码块测试
const d2RawCode = `x -> y: hello <script>alert(1)</script> & "world"`;
const d2Md = `\`\`\`d2\n${d2RawCode}\n\`\`\``;
const d2Html = renderMarkdown(d2Md, { settings: defaultSettings, highlighter: null });

// 必须输出带有 d2-diagram 类的安全占位节点
assert.ok(
  d2Html.includes('<div class="d2-diagram">'),
  "D2 fence must render as placeholder <div class=\"d2-diagram\">",
);

// 源码中不得含有裸 <script>alert(1)</script> 注入
assert.ok(
  !d2Html.includes("<script>alert(1)</script>"),
  "D2 placeholder must escape unsafe HTML tags like <script>",
);

// 必须包含转义后的字符
assert.ok(
  d2Html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"),
  "D2 placeholder must safely escape HTML entities",
);

// 2.3 验证在 DOM 中 innerHTML 解析后，通过 textContent 能够完全还原原始代码
const testDom = new JSDOM("<!DOCTYPE html><html><body><div id=\"preview\"></div></body></html>");
const doc = testDom.window.document;
const previewEl = doc.getElementById("preview");
const sanitizedD2 = purify.sanitize(d2Html);
previewEl.innerHTML = sanitizedD2;

const d2Placeholder = previewEl.querySelector(".d2-diagram");
assert.ok(d2Placeholder, "Placeholder element should exist in DOM after sanitize");
assert.equal(
  d2Placeholder.textContent.trim(),
  d2RawCode.trim(),
  "d2 element textContent must exactly restore the original raw D2 source code",
);

console.log("✓ D2 fenced block markdown & escaping tests passed!");

// 3. 测试 src/client/d2.ts 的 renderD2Blocks 行为
console.log("--- Testing renderD2Blocks DOM replacement & error handling ---");
globalThis.document = doc;

const d2TmpFile = resolve("scripts/.tmp-d2-bundle.mjs");
await esbuild.build({
  entryPoints: ["src/client/d2.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: d2TmpFile,
  packages: "external",
});

const { renderD2Blocks } = await import(d2TmpFile);
unlinkSync(d2TmpFile);

// 3.1 成功渲染测试：返回 { svg }，替换为 .bm-diagram
{
  const container = doc.createElement("div");
  container.innerHTML = `<div class="d2-diagram">x -&gt; y</div>`;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    assert.equal(url, "/api/render/d2");
    assert.equal(opts.method, "POST");
    const body = JSON.parse(opts.body);
    assert.equal(body.code, "x -> y");
    return {
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ svg: '<svg class="d2-rendered-svg" onload="alert(1)"><script>alert(1)</script></svg>' }),
    };
  };

  try {
    await renderD2Blocks(container, { isLatest: () => true });
    const diagramEl = container.querySelector(".bm-diagram");
    assert.ok(diagramEl, "Successful D2 render should create .bm-diagram element");
    assert.ok(diagramEl.querySelector("svg.d2-rendered-svg"), "Diagram should contain the returned SVG");
    assert.equal(diagramEl.querySelector("script"), null, "D2 SVG scripts must be removed");
    assert.equal(diagramEl.querySelector("svg").getAttribute("onload"), null, "D2 SVG event handlers must be removed");
    assert.equal(container.querySelector(".d2-diagram"), null, "Original placeholder should be replaced");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// 3.2 失败渲染测试：返回 { error }，替换为 .bm-error
{
  const container = doc.createElement("div");
  container.innerHTML = `<div class="d2-diagram">bad syntax</div>`;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 400,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => ({ error: "syntax error on line 1" }),
  });

  try {
    await renderD2Blocks(container, { isLatest: () => true });
    const errEl = container.querySelector(".bm-error");
    assert.ok(errEl, "Failed D2 render should create .bm-error element");
    assert.ok(errEl.textContent.includes("syntax error on line 1"), "Error element should show failure message");
    assert.equal(container.querySelector(".d2-diagram"), null, "Original placeholder should be replaced");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

// 3.3 isLatest 竞态保护测试：如果 isLatest 变为 false，不应继续渲染或替换节点
{
  const container = doc.createElement("div");
  container.innerHTML = `<div class="d2-diagram">pending code</div>`;

  let latest = true;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    latest = false; // 模拟在 fetch 返回前有新的渲染任务到来
    return {
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ svg: '<svg id="stale-svg"></svg>' }),
    };
  };

  try {
    await renderD2Blocks(container, { isLatest: () => latest });
    assert.equal(container.querySelector(".bm-diagram"), null, "Stale render must NOT be applied to DOM");
    assert.ok(container.querySelector(".d2-diagram"), "Original placeholder should remain untouched if outdated");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

console.log("✓ renderD2Blocks DOM lifecycle & race condition tests passed!");
