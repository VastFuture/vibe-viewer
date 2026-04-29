import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MarkdownFile } from "../../server/api.js";
import type { Settings } from "../state/store.js";
import { renderMarkdown } from "../markdown.js";
import { sanitizeIfNeeded } from "../security.js";
import { rewriteLocalAssets } from "../assets.js";
import { renderMermaidBlocks } from "../mermaid.js";
import { getHighlighter } from "../highlight.js";
import { THEMES } from "../themes.js";

interface Config {
  rootAbs: string;
  theme: string;
  rootName: string;
  extensions: string[];
}

interface PreviewProps {
  config: Config | null;
  file: MarkdownFile | null;
  settings: Settings;
  pendingHash: string | null;
  onHashConsumed: () => void;
  onOpenFile: (absPath: string, hash?: string) => void;
}

function scrollToHash(container: HTMLElement, hash: string) {
  const raw = hash.replace(/^#/, "");
  let id = raw;
  try {
    id = decodeURIComponent(raw);
  } catch {}
  if (!id) return;

  const target = container.querySelector(`#${CSS.escape(id)}`);
  if (!target) return;
  target.scrollIntoView({ block: "start" });
}

function attachMermaidClicks(container: HTMLElement, onOpen: (svgHtml: string) => void) {
  const diagrams = container.querySelectorAll(".bm-diagram");
  for (const el of diagrams) {
    const htmlEl = el as HTMLElement;
    if (htmlEl.dataset.fsBound === "1") continue;
    htmlEl.dataset.fsBound = "1";
    htmlEl.style.cursor = "pointer";
    htmlEl.title = "点击查看全屏 (滚轮缩放/拖拽平移)";
    htmlEl.addEventListener("click", (e) => {
      e.stopPropagation();
      const svg = el.querySelector("svg");
      if (!svg) return;
      onOpen(el.innerHTML);
    });
  }
}

// ---- Fullscreen Lightbox (inline component) ----

function FullscreenViewer({ svgHtml, onClose }: { svgHtml: string; onClose: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const transform = useRef({ x: 0, y: 0, scale: 1 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const applyTransform = useCallback(() => {
    const w = wrapRef.current;
    if (!w) return;
    const { x, y, scale } = transform.current;
    w.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  }, []);

  const setScale = useCallback((s: number) => {
    transform.current.scale = Math.max(0.25, Math.min(10, s));
    applyTransform();
  }, [applyTransform]);

  const zoomIn = useCallback(() => setScale(transform.current.scale * 1.3), [setScale]);
  const zoomOut = useCallback(() => setScale(transform.current.scale / 1.3), [setScale]);
  const reset = useCallback(() => {
    transform.current = { x: 0, y: 0, scale: 1 };
    applyTransform();
  }, [applyTransform]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fs-overlay" onClick={onClose}>
      {/* Toolbar */}
      <div className="fs-toolbar" onClick={(e) => e.stopPropagation()}>
        <button className="fs-btn" onClick={zoomIn} title="放大">+</button>
        <button className="fs-btn" onClick={zoomOut} title="缩小">−</button>
        <button className="fs-btn" onClick={reset} title="还原">1:1</button>
        <button className="fs-btn fs-close" onClick={onClose} title="关闭 (Esc)">✕</button>
      </div>

      {/* Zoomable wrapper */}
      <div
        className="fs-viewport"
        onWheel={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setScale(transform.current.scale * (e.deltaY < 0 ? 1.1 : 0.9));
        }}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          dragging.current = true;
          dragStart.current = {
            x: e.clientX,
            y: e.clientY,
            tx: transform.current.x,
            ty: transform.current.y,
          };
        }}
        onMouseMove={(e) => {
          if (!dragging.current) return;
          transform.current.x = dragStart.current.tx + (e.clientX - dragStart.current.x);
          transform.current.y = dragStart.current.ty + (e.clientY - dragStart.current.y);
          applyTransform();
        }}
        onMouseUp={() => { dragging.current = false; }}
        onMouseLeave={() => { dragging.current = false; }}
        onClick={(e) => e.stopPropagation()}
        style={{ cursor: dragging.current ? "grabbing" : "grab" }}
      >
        <div
          ref={wrapRef}
          className="fs-wrap"
          style={{ transform: "translate(0px, 0px) scale(1)", transition: "none" }}
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      </div>
    </div>
  );
}

export function Preview({
  config,
  file,
  settings,
  pendingHash,
  onHashConsumed,
  onOpenFile,
}: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderSeq = useRef(0);
  const [highlighter, setHighlighter] = useState(null);
  const [hlError, setHlError] = useState<string | null>(null);
  const [fsSvg, setFsSvg] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const hl = await getHighlighter();
        if (!canceled) setHighlighter(hl);
      } catch (err) {
        if (!canceled) setHlError(String(err));
      }
    })();
    return () => { canceled = true; };
  }, []);

  const content = file?.content ?? "";
  const currentAbsPath = file?.absPath ?? "";
  const rootAbs = config?.rootAbs ?? "";
  const mermaidTheme = THEMES.find((t) => t.name === settings.theme)?.mermaid ?? "tokyo-night";

  const mdHtml = useMemo(() => {
    if (!file) return "";
    const raw = renderMarkdown(content, { settings, highlighter });
    return sanitizeIfNeeded(raw, settings.securityLevel);
  }, [file, content, settings, highlighter]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    renderSeq.current += 1;
    const seq = renderSeq.current;
    const isLatest = () => renderSeq.current === seq;

    el.innerHTML = mdHtml;

    if (file && config) {
      rewriteLocalAssets(el, {
        rootAbs,
        currentAbsPath,
        securityLevel: settings.securityLevel,
        openMarkdownFile: onOpenFile,
      });
      void renderMermaidBlocks(el, { theme: mermaidTheme, isLatest }).then(() => {
        if (isLatest()) attachMermaidClicks(el, setFsSvg);
      });
    }

    if (pendingHash) {
      scrollToHash(el, pendingHash);
      onHashConsumed();
    }
  }, [mdHtml, file, config, rootAbs, currentAbsPath, settings.securityLevel, onOpenFile, mermaidTheme, pendingHash, onHashConsumed]);

  if (!file)
    return <div className="preview__body empty">请选择一个 Markdown 文件开始预览</div>;

  return (
    <>
      {fsSvg ? <FullscreenViewer svgHtml={fsSvg} onClose={() => setFsSvg(null)} /> : null}

      <div className="preview__body">
        <div className="md">
          {hlError ? (
            <div className="bm-error">
              shiki 初始化失败（已降级为普通代码块）：{hlError}
            </div>
          ) : null}
          <div ref={containerRef} />
        </div>
      </div>
    </>
  );
}
