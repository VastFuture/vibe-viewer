import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "./Sidebar.js";
import { Preview } from "./Preview.js";
import { connectWS } from "../ws.js";
import { loadSettings, saveSettings, loadLastFile, saveLastFile } from "../state/store.js";
import type { Settings } from "../state/store.js";
import type { FileTree, MarkdownFile } from "../../server/api.js";
import { THEMES } from "../themes.js";

interface Config {
  rootAbs: string;
  rootName: string;
  extensions: string[];
}

function firstFileAbs(items: FileTree["items"]): string | null {
  for (const it of items) {
    if (it.type === "file") return it.absPath;
    const sub = firstFileAbs(it.children!);
    if (sub) return sub;
  }
  return null;
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.json();
}

export function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [tree, setTree] = useState<FileTree | null>(null);
  const [filter, setFilter] = useState("");
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [current, setCurrent] = useState<MarkdownFile | null>(null);
  const [pendingHash, setPendingHash] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<"connecting" | "open" | "closed">("connecting");
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentAbs = current?.absPath ?? null;
  const currentMtime = current?.mtimeMs ?? null;
  const currentAbsRef = useRef(currentAbs);
  useEffect(() => { currentAbsRef.current = currentAbs; }, [currentAbs]);

  const openFile = useCallback(async (absPath: string, hash?: string) => {
    setError(null);
    setPendingHash(hash ?? null);
    try {
      const file = await fetchJson(`/api/file?path=${encodeURIComponent(absPath)}`);
      setCurrent(file);
      saveLastFile(file.absPath);
    } catch (err) {
      setCurrent(null);
      setError(`打开文件失败：${String(err)}`);
    }
  }, []);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const [cfg, tr] = await Promise.all([
          fetchJson("/api/config"),
          fetchJson("/api/tree"),
        ]);
        if (canceled) return;
        setConfig(cfg);
        setTree(tr);

        const last = loadLastFile();
        if (last) {
          await openFile(last);
          return;
        }

        const first = firstFileAbs(tr.items);
        if (first) await openFile(first);
      } catch (err) {
        if (canceled) return;
        setError(`初始化失败：${String(err)}`);
      }
    })();
    return () => { canceled = true; };
  }, [openFile]);

  const wsRef = useRef<ReturnType<typeof connectWS> | null>(null);
  useEffect(() => {
    wsRef.current?.close();
    wsRef.current = connectWS({
      onStatus: setWsStatus,
      onMessage: async (msg) => {
        if (msg.type === "tree-changed") {
          try {
            const tr = await fetchJson("/api/tree");
            setTree(tr);
          } catch {}
          return;
        }

        const cur = currentAbsRef.current;
        if (msg.type === "file-changed" && cur && msg.absPath === cur) {
          try {
            const file = await fetchJson(`/api/file?path=${encodeURIComponent(cur)}`);
            setCurrent(file);
          } catch {}
        }
      },
    });
    return () => wsRef.current?.close();
  }, []);

  useEffect(() => {
    saveSettings(settings);

    // Apply theme CSS variables
    const themeDef = THEMES.find((t) => t.name === settings.theme);
    if (themeDef) {
      const root = document.documentElement;
      for (const [key, val] of Object.entries(themeDef.vars)) {
        root.style.setProperty(key, val);
      }
    }
  }, [settings]);

  const rootHint = config ? `Root: ${config.rootName}` : "Root: ...";
  const wsHint =
    wsStatus === "open"
      ? "WS: 已连接"
      : wsStatus === "connecting"
        ? "WS: 连接中"
        : "WS: 已断开（自动重连）";

  return (
<div className={`app${sidebarOpen ? "" : " app--collapsed"}`}>
      {!sidebarOpen && (
        <button
          className="btn btn--icon sidebar__expand"
          onClick={() => setSidebarOpen(true)}
          title="展开侧边栏"
        >
          ▶
        </button>
      )}
      <div className="panel sidebar">
        <div className="sidebar__header">
          <div className="sidebar__top">
            <div className="brand">
              <div className="brand__title">vibe-viewer</div>
              <div className="brand__subtitle">
                {rootHint} · {wsHint}
              </div>
            </div>
            <button
              className="btn btn--icon sidebar__toggle"
              onClick={() => setSidebarOpen(false)}
              title="收起侧边栏"
            >
              ◀
            </button>
          </div>
          <input
            className="input"
            placeholder="过滤文件（支持路径片段）"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Sidebar tree={tree} filter={filter} currentAbsPath={currentAbs} onOpen={openFile} />
        <div className="settings">
          <div className="settings__title">设置</div>
          <div className="settings__row">
            <div>
              <div className="settings__label">主题</div>
              <div className="settings__hint">{THEMES.find((t) => t.name === settings.theme)?.label ?? settings.theme}</div>
            </div>
            <select
              className="settings__select"
              value={settings.theme}
              onChange={(e) =>
                setSettings((s) => ({ ...s, theme: e.target.value }))
              }
            >
              {THEMES.map((t) => (
                <option key={t.name} value={t.name}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="settings__row">
            <div>
              <div className="settings__label">安全级别</div>
              <div className="settings__hint">
                allow-all 仅建议用于可信本地文档；strict 会禁用原生 HTML
              </div>
            </div>
            <select
              className="settings__select"
              value={settings.securityLevel}
              onChange={(e) =>
                setSettings((s) => ({ ...s, securityLevel: e.target.value as Settings["securityLevel"] }))
              }
            >
              <option value="allow-all">allow-all</option>
              <option value="allow-html">allow-html</option>
              <option value="strict">strict</option>
            </select>
          </div>
          <div className="settings__row">
            <div>
              <div className="settings__label">软换行</div>
              <div className="settings__hint">对应 VS Code markdown.preview.breaks</div>
            </div>
            <input
              className="settings__toggle"
              type="checkbox"
              checked={settings.breaks}
              onChange={(e) => setSettings((s) => ({ ...s, breaks: e.target.checked }))}
            />
          </div>
          <div className="settings__row">
            <div>
              <div className="settings__label">Emoji</div>
              <div className="settings__hint">:smile: 之类</div>
            </div>
            <input
              className="settings__toggle"
              type="checkbox"
              checked={settings.emoji}
              onChange={(e) => setSettings((s) => ({ ...s, emoji: e.target.checked }))}
            />
          </div>
          <div className="settings__row">
            <div>
              <div className="settings__label">数学公式</div>
              <div className="settings__hint">$...$ / $$...$$ (KaTeX)</div>
            </div>
            <input
              className="settings__toggle"
              type="checkbox"
              checked={settings.math}
              onChange={(e) => setSettings((s) => ({ ...s, math: e.target.checked }))}
            />
          </div>
        </div>
      </div>
      <div className="panel preview">
        <div className="preview__header">
          <div className="filemeta">
            <div className="filemeta__path">{currentAbs ?? "未打开文件"}</div>
            <div className="filemeta__sub">
              {currentMtime ? `mtime: ${new Date(currentMtime).toLocaleString()}` : " "}
              {error ? ` · ${error}` : ""}
            </div>
          </div>
          <div className="actions">
            <button
              className="btn"
              onClick={() => currentAbs && openFile(currentAbs)}
            >
              重新加载
            </button>
          </div>
        </div>
        <Preview
          config={config}
          file={current}
          settings={settings}
          pendingHash={pendingHash}
          onHashConsumed={() => setPendingHash(null)}
          onOpenFile={openFile}
        />
      </div>
    </div>
  );
}
