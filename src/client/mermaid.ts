import { renderMermaid, THEMES } from "beautiful-mermaid";

export async function renderMermaidBlocks(
  container: HTMLElement,
  { theme, isLatest }: { theme: string; isLatest: () => boolean },
) {
  const nodes = Array.from(container.querySelectorAll("pre > code.language-mermaid"));
  if (nodes.length === 0) return;

  const themes = THEMES;
  let themeObj = theme;
  if (themes && typeof themes === "object") {
    themeObj = themes[theme] ?? themes["tokyo-night"];
    if (!themeObj) {
      const keys = Object.keys(themes);
      themeObj = keys.length ? themes[keys[0]] : theme;
    }
  }

  for (const codeEl of nodes) {
    if (!isLatest()) return;

    const pre = codeEl.parentElement;
    if (!pre) continue;

    const text = codeEl.textContent ?? "";
    if (!text.trim()) continue;

    try {
      const svg = await renderMermaid(text, themeObj);
      if (!isLatest()) return;

      const wrap = document.createElement("div");
      wrap.className = "bm-diagram";
      wrap.innerHTML = String(svg);
      pre.replaceWith(wrap);
    } catch {
      const err = document.createElement("div");
      err.className = "bm-error";
      err.textContent = "beautiful-mermaid 渲染失败（请检查语法或图类型是否受支持）";
      pre.insertAdjacentElement("beforebegin", err);
    }
  }
}
