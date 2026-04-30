import { createHighlighter, Highlighter } from "shiki";
import { THEMES } from "./themes.js";

let highlighterPromise: Promise<Highlighter> | null = null;

export async function getHighlighter() {
  if (highlighterPromise) return highlighterPromise;

  highlighterPromise = (async () => {
    const hl = await createHighlighter({
      themes: ["github-dark", "github-light"],
      langs: [
        "bash",
        "css",
        "html",
        "javascript",
        "json",
        "jsx",
        "markdown",
        "tsx",
        "typescript",
        "yaml",
      ],
    });
    return hl;
  })();

  return highlighterPromise;
}

export function shikiThemeForUi(uiTheme: string): "github-dark" | "github-light" {
  const def = THEMES.find((t) => t.name === uiTheme);
  if (def?.type === "light") return "github-light";
  return "github-dark";
}