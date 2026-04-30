import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MarkdownFile } from "../../server/api.js";
import type { Settings } from "../state/store.js";
import { renderMarkdown } from "../markdown.js";
import { sanitizeIfNeeded } from "../security.js";
import { rewriteLocalAssets } from "../assets.js";
import { initMermaid, renderMermaidBlocks } from "../mermaid.js";
import { getHighlighter } from "../highlight.js";
import { THEMES } from "../themes.js";

interface Config {
  rootAbs: string;
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

// ---- Fullscreen Lightbox ----

function svgToImgUrl(raw: string): string {
  const fixed = raw.replace(/var\(--[a-z-]+\)/g, (match) => {
    const map: Record<string, string> = {
      "var(--mono)": "ui-monospace,SFMono-Regular,Menlo,monospace",
      "var(--ui)": "system-ui,sans-serif",
      "var(--content)": "Georgia,serif",
    };
    return map[match] ?? "sans-serif";
  });
  const blob = new Blob([fixed], { type: "image/svg+xml" });
  return URL.createObjectURL(blob);
}

const FS_ZOOM_STEPS = [20, 40, 60, 80, 100, 130, 160, 200, 260, 320, 400, 500];

function FullscreenViewer({ svgHtml, onClose, isLight }: { svgHtml: string; onClose: () => void; isLight: boolean }) {
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const imgUrl = useMemo(() => svgToImgUrl(svgHtml), [svgHtml]);
  const dragRef = useRef({ active: false, sx: 0, sy: 0, px: 0, py: 0 });

  useEffect(() => () => URL.revokeObjectURL(imgUrl), [imgUrl]);

  const stepZoom = useCallback((dir: 1 | -1) => {
    setZoom((z) => {
      const idx = FS_ZOOM_STEPS.findIndex((s) => s >= z);
      const next = idx === -1
        ? (dir === 1 ? FS_ZOOM_STEPS.length - 1 : 0)
        : Math.max(0, Math.min(FS_ZOOM_STEPS.length - 1, idx + dir));
      return FS_ZOOM_STEPS[next];
    });
  }, []);

  const resetView = useCallback(() => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const vp = document.getElementById("fs-viewport");
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stepZoom(e.deltaY < 0 ? 1 : -1);
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, [stepZoom]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { active: true, sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
  }, [pan]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active) return;
    setPan({ x: d.px + (e.clientX - d.sx), y: d.py + (e.clientY - d.sy) });
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  const pct = zoom;

  return (
    <div className={`fs-overlay${isLight ? " fs-light" : ""}`} onClick={onClose}>
      <div className="fs-toolbar" onClick={(e) => e.stopPropagation()}>
        <span className="fs-zoom-label">{pct}%</span>
        <button className="fs-btn" onClick={() => stepZoom(1)} title="放大">+</button>
        <button className="fs-btn" onClick={() => stepZoom(-1)} title="缩小">−</button>
        <button className="fs-btn" onClick={resetView} title="还原">1:1</button>
        <button className="fs-btn fs-close" onClick={onClose} title="关闭 (Esc)">✕</button>
      </div>

      <div
        id="fs-viewport"
        className="fs-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          className="fs-img"
          src={imgUrl}
          alt="Mermaid 全屏预览"
          draggable={false}
          style={{
            width: `${pct}%`,
            transform: `translate(${pan.x}px, ${pan.y}px)`,
          }}
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
  const mermaidTheme = THEMES.find((t) => t.name === settings.theme)?.mermaid ?? "dark";

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

      initMermaid(mermaidTheme);
      void renderMermaidBlocks(el, { isLatest }).then(() => {
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
      {fsSvg ? <FullscreenViewer svgHtml={fsSvg} onClose={() => setFsSvg(null)} isLight={settings.theme === "github-light"} /> : null}

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
