# vibe-viewer

`vibe-viewer` is a local Markdown browser you can run with `npx`.

Key features:

- One-command launch: `npx vibe-viewer`
- Pick a root directory and browse all Markdown files (recursively) in your browser
- File tree on the left, preview on the right
- Rendering pipeline: `markdown-it -> HTML -> DOM post-process (asset rewriting + beautiful-mermaid)`
- Mermaid fenced blocks (```mermaid) are rendered to SVG via **beautiful-mermaid**
- Auto refresh on save/add/remove (WebSocket + chokidar)

## Quick Start

Requirements: Node.js `>= 18.18`.

Interactive mode (choose a directory):

```bash
npx -y vibe-viewer
```

Run with a fixed root directory:

```bash
npx -y vibe-viewer --dir /path/to/your/docs
```

Do not open the browser automatically:

```bash
npx -y vibe-viewer --no-open
```

## CLI Options

- `--dir <path>`: Root directory (if omitted, you'll be prompted)
- `--theme <name>`: beautiful-mermaid theme name (default: `tokyo-night`)
- `--no-open`: Do not open the browser automatically

## UI Settings

In the sidebar footer you can configure:

- `securityLevel`
  - `allow-all` (default): allow raw HTML; no sanitization; do not block `javascript:` links (only recommended for trusted local docs)
  - `allow-html`: allow raw HTML; apply basic sanitization; block `javascript:` links
  - `strict`: set `markdown-it` to `html=false`; block high-risk protocols like `javascript:` / `data:`
- `breaks`: soft line breaks (similar to VS Code `markdown.preview.breaks`)
- `emoji`: enable/disable `markdown-it-emoji`
- `math`: enable/disable `markdown-it-katex` (KaTeX)

## Development

```bash
npm install
npm run build
node dist/cli.js --dir ./fixtures --no-open
```

## Tests

Run everything (build + render snapshots + server/WS/watcher):

```bash
npm test
```

- Render regression: `npm run test:render`
  - Fixtures: `fixtures/*.md`, `fixtures/**/*.md`
  - Snapshots: `fixtures/__snapshots__/*.html`
  - Coverage: securityLevel + breaks/emoji/math combinations, asset rewriting, beautiful-mermaid rendering, etc.
- Server regression: `npm run test:server`
  - Coverage: `/api/tree`, `/api/file`, WebSocket `file-changed` / `tree-changed`, watching opened files outside Root,
    and edge cases like unix sockets under Root (e.g. `~/.docker/run/docker.sock`).

## Security Note

This project assumes "local use + trusted Markdown content" and defaults to `securityLevel=allow-all`.

Notes:

- `markdown-it-katex` has a known XSS advisory reported by `npm audit` (no upstream fix at the time of writing).
  If you render untrusted docs, prefer `allow-html` (sanitized) or `strict` (disable raw HTML).
