import DOMPurify from "dompurify";

function sanitizeSvg(svg: string, ownerDocument: Document): string {
  const purifier = typeof (DOMPurify as any)?.sanitize === "function"
    ? DOMPurify as any
    : (DOMPurify as any)(ownerDocument.defaultView);
  return purifier.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
}

async function fetchD2Svg(code: string): Promise<string> {
  const res = await fetch("/api/render/d2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    if (data.error) {
      throw new Error(data.error);
    }
    if (typeof data.svg === "string") {
      return data.svg;
    }
    throw new Error("响应缺少 svg 字段");
  }

  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `HTTP ${res.status}`);
  }
  return text;
}

export async function renderD2Blocks(
  container: HTMLElement,
  { isLatest }: { isLatest: () => boolean },
) {
  const nodes = Array.from(container.querySelectorAll("div.d2-diagram"));
  if (nodes.length === 0) return;

  await Promise.all(nodes.map(async (node) => {
    if (!isLatest()) return;

    const el = node as HTMLElement;
    const text = el.textContent ?? "";
    if (!text.trim()) return;

    const ownerDoc = el.ownerDocument || document;
    try {
      const svg = await fetchD2Svg(text);
      if (!isLatest()) return;

      const wrap = ownerDoc.createElement("div");
      wrap.className = "bm-diagram";
      wrap.innerHTML = sanitizeSvg(svg, ownerDoc);
      if (!wrap.querySelector("svg")) throw new Error("响应不包含有效 SVG");
      el.replaceWith(wrap);
    } catch (err) {
      if (!isLatest()) return;
      console.warn("[d2] render failed:", String(err));
      const errEl = ownerDoc.createElement("div");
      errEl.className = "bm-error";
      const errStr = err instanceof Error ? err.message : String(err);
      errEl.textContent = `D2 渲染失败：${errStr.slice(0, 200)}`;
      el.replaceWith(errEl);
    }
  }));
}
