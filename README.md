# vibeview

`vibeview` is a local Markdown browser you can run with `npx`.

Key features:

- One-command launch: `npx vibeview`
- Pick a root directory and browse all Markdown files (recursively) in your browser
- File tree on the left, preview on the right
- Rendering pipeline: `markdown-it → HTML → DOM post-process (asset rewriting + Mermaid.js)`
- Mermaid fenced blocks (\`\`\`mermaid) rendered to SVG via **Mermaid.js 11.x** with fullscreen viewer
- 8 built-in themes (GitHub Dark, GitHub Light, Nord, Dracula, Catppuccin, Solarized, One Dark, Monokai)
- Collapsible sidebar
- Auto refresh on save/add/remove (WebSocket + chokidar)

## Quick Start

Requirements: Node.js `>= 18.18`.

Interactive mode (choose a directory):

```bash
npx vibeview
```

Run with a fixed root directory:

```bash
npx vibeview --dir /path/to/your/docs
```

Do not open the browser automatically:

```bash
npx vibeview --no-open
```

## CLI Options

- `--dir <path>`: Root directory (if omitted, you'll be prompted)
- `--no-open`: Do not open the browser automatically
- `-h, --help`: Show help

## UI Settings

In the sidebar you can configure:

- **Theme**: 8 built-in themes (dark/light)
- **Security level**
  - `allow-all` (default): allow raw HTML; no sanitization; do not block `javascript:` links (only recommended for trusted local docs)
  - `allow-html`: allow raw HTML; apply basic sanitization; block `javascript:` links
  - `strict`: set `markdown-it` to `html=false`; block high-risk protocols like `javascript:` / `data:`
- **Soft breaks**: soft line breaks (similar to VS Code `markdown.preview.breaks`)
- **Emoji**: enable/disable `markdown-it-emoji` (`:smile:` syntax)
- **Math**: enable/disable `markdown-it-katex` ($...$ / $$...$$)

## Development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
node dist/cli.js --dir ./fixtures --no-open
```

## Tests

```bash
npm test
```

- Render regression: `npm run test:render`
- Server regression: `npm run test:server`

## Security Note

This project assumes "local use + trusted Markdown content" and defaults to `securityLevel=allow-all`.

- `markdown-it-katex` has a known XSS advisory reported by `npm audit` (no upstream fix at the time of writing).
  If you render untrusted docs, prefer `allow-html` (sanitized) or `strict` (disable raw HTML).