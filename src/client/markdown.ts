import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
import { full as emoji } from "markdown-it-emoji";
import katex from "markdown-it-katex";
import tasklists from "markdown-it-task-lists";
import SlackSlug from "github-slugger";
import type { Highlighter } from "shiki";
import type { Settings } from "./state/store.js";
import { shikiThemeForUi } from "./highlight.js";

export function renderMarkdown(
  content: string,
  { settings, highlighter }: { settings: Settings; highlighter: Highlighter | null },
) {
  const allowHtml = settings.securityLevel !== "strict";

  const md = new MarkdownIt({
    html: allowHtml,
    linkify: true,
    typographer: true,
    breaks: settings.breaks,
  });

  if (settings.securityLevel === "allow-all") {
    md.validateLink = () => true;
  }

  md.use(tasklists, { enabled: true, label: true, labelAfter: true });
  if (settings.emoji) md.use(emoji);
  if (settings.math) md.use(katex);

  const slugger = new SlackSlug();
  md.use(anchor, {
    slugify: (s) => slugger.slug(s),
    permalink: anchor.permalink.ariaHidden({
      placement: "before",
    }),
  });

  const defaultFence = md.renderer.rules.fence!;
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const info = (token.info ?? "").trim();
    const lang = info.split(/\s+/g)[0]?.toLowerCase() ?? "";

    // Mermaid: wrap in <div class="mermaid"> for mermaid.js to render
    if (lang === "mermaid") {
      return `<div class="mermaid">\n${token.content}\n</div>\n`;
    }

    // Other languages: use shiki highlighter if available
    if (highlighter) {
      try {
        return highlighter.codeToHtml(token.content, { lang, theme: shikiThemeForUi(settings.theme) });
      } catch {}
    }

    return defaultFence(tokens, idx, options, env, self);
  };

  return md.render(content);
}
