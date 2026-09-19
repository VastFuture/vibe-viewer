#!/usr/bin/env node
import assert from "node:assert/strict";
import MarkdownIt from "markdown-it";
import mdAnchor from "markdown-it-anchor";
import taskLists from "markdown-it-task-lists";
import { full as emoji } from "markdown-it-emoji";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

console.log("--- Running Markdown & Security render pipeline tests ---");

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

console.log("✓ Markdown pipeline rendered and sanitized correctly!");
