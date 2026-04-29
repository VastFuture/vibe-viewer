import chokidar from "chokidar";
import fs from "node:fs/promises";
import path from "node:path";
import { isMarkdownPath } from "./api.js";

interface WatcherOpts {
  rootAbs: string;
  extensions: string[];
  broadcast: (msg: Record<string, unknown>) => void;
}

export function createWatcher({ rootAbs, extensions, broadcast }: WatcherOpts) {
  const rootNorm = path.resolve(rootAbs);
  let treeTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleTreeChanged() {
    if (treeTimer) return;
    treeTimer = setTimeout(() => {
      treeTimer = null;
      broadcast({ type: "tree-changed" });
    }, 200);
  }

  const EXPLICIT_FILES = new Set<string>();

  const baseOptions: chokidar.WatchOptions = {
    ignoreInitial: true,
    ignorePermissionErrors: true,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 50,
    },
    ignored: (p: string, stats?: fs.Stats) => {
      const base = path.basename(p);
      if (base === ".git") return true;
      if (base === "node_modules") return true;
      if (base === ".DS_Store") return true;
      if (stats?.isSocket?.()) return true;
      if (stats?.isFIFO?.()) return true;
      if (stats?.isBlockDevice?.()) return true;
      if (stats?.isCharacterDevice?.()) return true;
      if (stats?.isFile?.() && !isMarkdownPath(p, extensions)) return true;
      if (!stats) {
        const lower = base.toLowerCase();
        if (lower.endsWith(".sock")) return true;
      }
      return false;
    },
  };

  let resourceLimitWarned = false;
  let degradedToExplicitOnly = false;
  let watcher: chokidar.FSWatcher;

  async function emitFileChanged(absPath: string) {
    const abs = path.resolve(absPath);
    if (!isMarkdownPath(abs, extensions)) return;
    try {
      const st = await fs.stat(abs);
      broadcast({ type: "file-changed", absPath: abs, mtimeMs: st.mtimeMs });
    } catch {
      broadcast({ type: "file-changed", absPath: abs, mtimeMs: Date.now() });
    }
  }

  function isWithinRoot(absPath: string) {
    const rel = path.relative(rootNorm, absPath);
    return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
  }

  function attachWatcherHandlers(w: chokidar.FSWatcher) {
    w.on("change", (p) => {
      console.log(`[watcher] file changed: ${path.relative(rootNorm, p)}`);
      void emitFileChanged(p);
    });
    w.on("add", (p) => {
      const abs = path.resolve(p);
      if (!isMarkdownPath(abs, extensions)) return;
      if (isWithinRoot(abs)) {
        console.log(`[watcher] file added: ${path.relative(rootNorm, p)}`);
        scheduleTreeChanged();
      }
    });
    w.on("unlink", (p) => {
      const abs = path.resolve(p);
      if (!isMarkdownPath(abs, extensions)) return;
      if (isWithinRoot(abs)) {
        console.log(`[watcher] file removed: ${path.relative(rootNorm, p)}`);
        scheduleTreeChanged();
      }
    });
    w.on("ready", () => {
      const watched = (w as any).getWatched?.();
      const count = watched ? Object.keys(watched).length : "?";
      console.log(`[watcher] ready — watching ${count} directories under ${path.basename(rootNorm)}`);
    });
  }

  async function degradeWatchMode() {
    if (degradedToExplicitOnly) return;
    degradedToExplicitOnly = true;
    const prev = watcher;
    watcher = chokidar.watch([], baseOptions);
    attachErrorHandler(watcher);
    attachWatcherHandlers(watcher);
    if (EXPLICIT_FILES.size > 0) watcher.add([...EXPLICIT_FILES]);
    try {
      await prev.close();
    } catch {}
  }

  function attachErrorHandler(w: chokidar.FSWatcher) {
    w.on("error", (err) => {
      const anyErr = err as Record<string, unknown> | undefined;
      const code = anyErr?.code ? String(anyErr.code) : "";
      const p = anyErr?.path ? String(anyErr.path) : "";
      const msg = anyErr?.message ? String(anyErr.message) : String(err);

      if (code === "EMFILE" || code === "ENOSPC") {
        if (!resourceLimitWarned) {
          resourceLimitWarned = true;
          console.warn(
            [
              `[watcher] error(${code}): ${msg}`,
              "[watcher] 监听数量触及系统上限，已自动降级为：仅监听已打开的 Markdown 文件（不再递归监听 Root）。",
              "[watcher] 建议：",
              "  1) Root 请选择更小的目录（例如你的 docs/notes 目录，而不是整个 ~）。",
              "  2) 或提高系统打开文件上限（macOS/Linux 可尝试：ulimit -n 4096）。",
            ].join("\n"),
          );
        }
        void degradeWatchMode();
        return;
      }

      console.warn(
        `[watcher] error${code ? `(${code})` : ""}${p ? `: ${p}` : ""}: ${msg}`,
      );
    });
  }

  watcher = chokidar.watch(rootNorm, baseOptions);
  attachErrorHandler(watcher);
  attachWatcherHandlers(watcher);

  return {
    addFile(absPath: string) {
      const abs = path.resolve(absPath);
      EXPLICIT_FILES.add(abs);
      watcher.add(abs);
    },
    async close() {
      if (treeTimer) clearTimeout(treeTimer);
      await watcher.close();
    },
  };
}
