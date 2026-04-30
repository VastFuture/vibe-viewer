import mermaid from "mermaid";

let initialized = false;

export function initMermaid(theme: "dark" | "neutral" | "default") {
  if (initialized) {
    mermaid.initialize({ theme });
    return;
  }
  initialized = true;

  mermaid.initialize({
    startOnLoad: false,
    theme,
    securityLevel: "loose",
    fontFamily: "var(--mono), ui-monospace, SFMono-Regular, monospace",
  });
}

export async function renderMermaidBlocks(
  container: HTMLElement,
  { isLatest }: { isLatest: () => boolean },
) {
  const nodes = Array.from(container.querySelectorAll("div.mermaid"));
  if (nodes.length === 0) return;

  for (let i = 0; i < nodes.length; i++) {
    if (!isLatest()) return;

    const el = nodes[i] as HTMLElement;
    const text = el.textContent ?? "";
    if (!text.trim()) continue;

    const id = `mermaid-${Date.now()}-${i}`;
    try {
      const { svg } = await mermaid.render(id, text);
      if (!isLatest()) return;

      const wrap = document.createElement("div");
      wrap.className = "bm-diagram";
      wrap.innerHTML = svg;
      el.replaceWith(wrap);
    } catch (err) {
      console.warn("[mermaid] render failed:", String(err));
      const errEl = document.createElement("div");
      errEl.className = "bm-error";
      errEl.textContent = `Mermaid 渲染失败：${String(err).slice(0, 200)}`;
      el.replaceWith(errEl);
    }
  }
}
