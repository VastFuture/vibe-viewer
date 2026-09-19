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

const ZOOM_STEPS = [10, 25, 50, 75, 100, 125, 150, 200, 300, 400, 600, 800];

/* ── 通用全功能图片交互查看器 (可内嵌可全屏，支持滚轮缩放、拖拽平移、适应视口、全屏切换) ── */
function ImageViewer({
  src,
  alt,
  meta,
  fullscreen = false,
  onClose,
  isLight,
}: {
  src: string;
  alt: string;
  meta?: string;
  fullscreen?: boolean;
  onClose?: () => void;
  isLight?: boolean;
}) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fitMode, setFitMode] = useState<"contain" | "actual">("contain");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, sx: 0, sy: 0, px: 0, py: 0 });

  const resetFit = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setFitMode("contain");
  }, []);

  const actualSize = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setFitMode("actual");
  }, []);

  const stepZoom = useCallback((dir: 1 | -1) => {
    setFitMode("actual");
    setScale((s) => {
      const currentPct = Math.round(s * 100);
      const idx = ZOOM_STEPS.findIndex((step) => step >= currentPct);
      let nextPct: number;
      if (idx === -1) {
        nextPct = dir === 1 ? ZOOM_STEPS[ZOOM_STEPS.length - 1] : ZOOM_STEPS[0];
      } else {
        const nextIdx = Math.max(0, Math.min(ZOOM_STEPS.length - 1, idx + dir));
        nextPct = ZOOM_STEPS[nextIdx];
      }
      return nextPct / 100;
    });
  }, []);

  // 滚轮缩放支持
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stepZoom(e.deltaY < 0 ? 1 : -1);
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, [stepZoom]);

  // 全屏模式下 Esc 退出
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fullscreen && onClose) onClose();
        else if (isFullscreen) setIsFullscreen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [fullscreen, onClose, isFullscreen]);

  // 指针拖拽平移
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

  const effectiveFs = fullscreen || isFullscreen;
  const zoomDisplay = Math.round(scale * 100);

  const content = (
    <div
      className={`img-viewer-container${effectiveFs ? " img-viewer-container--fs" : ""}${isLight ? " img-viewer--light" : ""}`}
    >
      {/* 控制栏 */}
      <div className="img-viewer__toolbar">
        <span className="img-viewer__zoom-label">{zoomDisplay}%</span>
        <button className="img-viewer__btn" onClick={() => stepZoom(1)} title="放大 (+)">
          +
        </button>
        <button className="img-viewer__btn" onClick={() => stepZoom(-1)} title="缩小 (-)">
          −
        </button>
        <button
          className={`img-viewer__btn ${fitMode === "contain" ? "img-viewer__btn--active" : ""}`}
          onClick={resetFit}
          title="自适应全幅占满视口"
        >
          适应
        </button>
        <button
          className={`img-viewer__btn ${fitMode === "actual" ? "img-viewer__btn--active" : ""}`}
          onClick={actualSize}
          title="1:1 原始尺寸"
        >
          1:1
        </button>

        {/* 全屏切换按钮 */}
        {!fullscreen ? (
          <button
            className="img-viewer__btn"
            onClick={() => setIsFullscreen((f) => !f)}
            title={isFullscreen ? "退出全屏 (Esc)" : "全屏查看"}
          >
            {isFullscreen ? "退出全屏" : "全屏"}
          </button>
        ) : (
          <button className="img-viewer__btn img-viewer__btn--close" onClick={onClose} title="关闭 (Esc)">
            ✕
          </button>
        )}

        {meta && <span className="img-viewer__meta">{meta}</span>}
      </div>

      {/* 视口画布 */}
      <div
        ref={viewportRef}
        className="img-viewer__viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className={`img-viewer__img ${fitMode === "contain" ? "img-viewer__img--contain" : "img-viewer__img--actual"}`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          }}
        />
      </div>
    </div>
  );

  return content;
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
  const isLight = settings.theme === "github-light";
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
    return <div className="preview__body empty">请选择一个文件开始预览</div>;

  // 图片文件展示：默认自适应占满右侧区域，支持平移缩放全屏
  if (file.fileType === "image") {
    const rawSrc = `/raw?path=${encodeURIComponent(file.absPath)}`;
    const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
    return (
      <div className="preview__body preview__body--fill">
        <ImageViewer
          src={rawSrc}
          alt={file.relPath ?? file.absPath}
          meta={sizeStr}
          isLight={isLight}
        />
      </div>
    );
  }

  // HTML 沙箱网页展示：占满右侧全区域
  if (file.fileType === "html") {
    const rawSrc = `/raw?path=${encodeURIComponent(file.absPath)}`;
    return (
      <div className="preview__body preview__body--fill">
        <iframe
          src={rawSrc}
          title={file.relPath ?? file.absPath}
          className="preview-iframe"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    );
  }

  // Markdown 文档展示
  return (
    <>
      {fsSvg ? (
        <ImageViewer
          src={svgToImgUrl(fsSvg)}
          alt="Mermaid 全屏预览"
          fullscreen={true}
          onClose={() => setFsSvg(null)}
          isLight={isLight}
        />
      ) : null}

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
