# vibeview

A zero-config local Markdown browser — one command, instant preview.

## Features

- **One-command launch**: `npx vibeview` — picks a directory and opens your browser
- **File tree + live preview**: sidebar navigation, render-as-you-read
- **Full rendering pipeline**: markdown-it → HTML → DOM post-process (asset rewriting + Mermaid.js)
- **Mermaid.js 11.x**: fenced `mermaid` blocks rendered to SVG with fullscreen infinite-canvas viewer
- **8 built-in themes**: GitHub Light (default), GitHub Dark, Nord, Dracula, Catppuccin, Solarized, One Dark, Monokai
- **Collapsible sidebar**: toggle open/close with smooth animation
- **Auto refresh**: WebSocket + chokidar watches your files — save, add, or delete, the browser updates instantly
- **Code syntax highlighting**: Shiki with theme-aware coloring (light UI → light code, dark UI → dark code)
- **Math support**: KaTeX (`$...$` / `$$...$$`)
- **Emoji**: markdown-it-emoji (`:smile:` syntax)

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

| Option | Description |
|--------|-------------|
| `--dir <path>` | Root directory (if omitted, you'll be prompted) |
| `--no-open` | Do not open the browser automatically |
| `-h, --help` | Show help |

## Install Globally

```bash
cd vibeview && npm run install:global
```

Then `vibeview` is available anywhere on your system.

## UI Settings

In the sidebar you can configure:

- **Theme**: 8 built-in themes (6 dark + 2 light), default is GitHub Light
- **Security level**
  - `allow-all` (default): allow raw HTML; no sanitization; do not block `javascript:` links (only recommended for trusted local docs)
  - `allow-html`: allow raw HTML; apply basic sanitization; block `javascript:` links
  - `strict`: set `markdown-it` to `html=false`; block `javascript:` / `data:` protocols
- **Soft breaks**: soft line breaks (similar to VS Code `markdown.preview.breaks`)
- **Emoji**: enable/disable `:smile:` syntax
- **Math**: enable/disable KaTeX rendering

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

Install globally from source:

```bash
npm run install:global
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

## License

MIT