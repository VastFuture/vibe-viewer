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
  const [copied, setCopied] = useState(false);
  const [tree, setTree] = useState<FileTree | null>(null);
  const [filter, setFilter] = useState("");
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [current, setCurrent] = useState<MarkdownFile | null>(null);
  const [pendingHash, setPendingHash] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<"connecting" | "open" | "closed">("connecting");
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [locateTrigger, setLocateTrigger] = useState(0);

  const currentAbs = current?.absPath ?? null;
  const currentMtime = current?.mtimeMs ?? null;
  const currentAbsRef = useRef(currentAbs);
  useEffect(() => { currentAbsRef.current = currentAbs; }, [currentAbs]);

  const handleHashConsumed = useCallback(() => setPendingHash(null), []);

  const copyPath = useCallback(() => {
    if (!currentAbs) return;
    navigator.clipboard?.writeText(currentAbs).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [currentAbs]);

  const syncExtensions = useCallback(async (extsStr: string) => {
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extensions: extsStr }),
      });
      if (res.ok) {
        const cfg = await res.json();
        setConfig(cfg);
        const tr = await fetchJson("/api/tree");
        setTree(tr);
      }
    } catch {}
  }, []);

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
        if (settings.extensions) {
          try {
            await fetch("/api/config", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ extensions: settings.extensions }),
            });
          } catch {}
        }
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
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
      <div className="panel sidebar">
        <div className="sidebar__header">
          <div className="sidebar__top">
            <div className="brand">
              <div className="brand__title">vibeview</div>
              <div className="brand__subtitle">
                {rootHint} · {wsHint}
              </div>
            </div>
            <button
              className="btn btn--icon sidebar__toggle"
              onClick={() => setSidebarOpen(false)}
              title="收起侧边栏"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>
          <input
            className="input"
            placeholder="过滤文件（支持路径片段）"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Sidebar 
          tree={tree} 
          filter={filter} 
          currentAbsPath={currentAbs} 
          onOpen={openFile}
          autoLocate={settings.autoLocate}
          locateTrigger={locateTrigger}
        />
        <div className={`settings ${settingsOpen ? "settings--open" : ""}`}>
          <div
            className="settings__header"
            onClick={() => setSettingsOpen((o) => !o)}
            title="点击展开/折叠设置选项"
          >
            <div className="settings__header-left">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.75 }}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span className="settings__title">偏好设置</span>
            </div>
            <div className={`settings__arrow ${settingsOpen ? "settings__arrow--open" : ""}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
          {settingsOpen && (
            <div className="settings__body">
              <div className="settings__row">
                <div>
                  <div className="settings__label">文件格式</div>
                  <div className="settings__hint">支持后缀 (逗号分隔)</div>
                </div>
                <input
                  className="settings__input"
                  type="text"
                  value={settings.extensions}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, extensions: e.target.value }))
                  }
                  onBlur={() => syncExtensions(settings.extensions)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  placeholder=".md, .html, .png..."
                  title="输入支持的文件后缀，回车或失焦生效"
                />
              </div>
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
                    allow-all 允许脚本；strict 禁用原生 HTML
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
                  <div className="settings__hint">VS Code 风格软折行</div>
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
                  <div className="settings__label">Emoji 渲染</div>
                  <div className="settings__hint">:smile: 转换</div>
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
                  <div className="settings__label">自动定位当前文件</div>
                  <div className="settings__hint">刷新后自动展开树并定位</div>
                </div>
                <input
                  className="settings__toggle"
                  type="checkbox"
                  checked={settings.autoLocate}
                  onChange={(e) => setSettings((s) => ({ ...s, autoLocate: e.target.checked }))}
                />
              </div>
              <div className="settings__row">
                <div>
                  <div className="settings__label">KaTeX 数学公式</div>
                  <div className="settings__hint">$...$ / $$...$$</div>
                </div>
                <input
                  className="settings__toggle"
                  type="checkbox"
                  checked={settings.math}
                  onChange={(e) => setSettings((s) => ({ ...s, math: e.target.checked }))}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="panel preview">
        <div className="preview__header">
          <div className="filemeta">
            <div className="filemeta__path-row">
              <div className="filemeta__path" title={currentAbs ?? "未打开文件"}>
                {currentAbs ?? "未打开文件"}
              </div>
              {currentAbs && (
                <button
                  className="btn btn--copy"
                  onClick={copyPath}
                  title="复制绝对路径"
                >
                  {copied ? "已复制" : "复制"}
                </button>
              )}
            </div>
            <div className="filemeta__sub">
              {currentMtime ? `mtime: ${new Date(currentMtime).toLocaleString()}` : " "}
              {error ? ` · ${error}` : ""}
            </div>
          </div>
          <div className="actions">
            <button
              className="btn btn--icon"
              onClick={() => setLocateTrigger(t => t + 1)}
              title="在目录树中定位当前文件"
              disabled={!currentAbs}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
              </svg>
            </button>
            <button
              className="btn"
              onClick={() => currentAbs && openFile(currentAbs)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5, verticalAlign: "-1px" }}>
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              刷新
            </button>
          </div>
        </div>
        <Preview
          config={config}
          file={current}
          settings={settings}
          pendingHash={pendingHash}
          onHashConsumed={handleHashConsumed}
          onOpenFile={openFile}
        />
      </div>
    </div>
  );
}
