import { createHighlighter, Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

export async function getHighlighter() {
  if (highlighterPromise) return highlighterPromise;

  highlighterPromise = (async () => {
    const hl = await createHighlighter({
      themes: ["github-dark"],
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
