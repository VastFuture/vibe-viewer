import fs from "node:fs/promises";
import path from "node:path";

export const DEFAULT_EXTENSIONS = [".md", ".mdx", ".markdown"];

const IGNORED_DIRS = new Set([".git", "node_modules"]);

export interface TreeItem {
  type: "dir" | "file";
  name: string;
  relPath: string;
  children?: TreeItem[];
  absPath?: string;
  mtimeMs?: number;
  size?: number;
}

export interface FileTree {
  rootAbs: string;
  rootName: string;
  generatedAt: number;
  items: TreeItem[];
}

export interface MarkdownFile {
  absPath: string;
  relPath: string | null;
  mtimeMs: number;
  size: number;
  content: string;
}

function toPosixRelPath(...parts: (string | undefined | null)[]) {
  return parts.filter(Boolean).join("/").replaceAll("\\", "/");
}

export function isMarkdownPath(absPath: string, extensions = DEFAULT_EXTENSIONS) {
  const lower = absPath.toLowerCase();
  return extensions.some((ext) => lower.endsWith(ext));
}

function isSubpath(rootAbs: string, targetAbs: string) {
  const rel = path.relative(rootAbs, targetAbs);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

async function scanDir(
  dirAbs: string,
  relDir: string,
  rootAbs: string,
  extensions: string[],
): Promise<TreeItem[]> {
  let entries: fs.Dirent[];
  try {
    entries = await fs.readdir(dirAbs, { withFileTypes: true });
  } catch {
    return [];
  }

  const children: TreeItem[] = [];

  for (const ent of entries) {
    if (ent.isDirectory() && IGNORED_DIRS.has(ent.name)) continue;
    if (ent.name === ".DS_Store") continue;

    const abs = path.join(dirAbs, ent.name);
    const rel = relDir ? toPosixRelPath(relDir, ent.name) : ent.name;

    if (ent.isDirectory()) {
      const sub = await scanDir(abs, rel, rootAbs, extensions);
      if (sub.length > 0) {
        children.push({ type: "dir", name: ent.name, relPath: rel, children: sub });
      }
      continue;
    }

    if (ent.isFile()) {
      if (!isMarkdownPath(abs, extensions)) continue;
      try {
        const st = await fs.stat(abs);
        children.push({
          type: "file",
          name: ent.name,
          relPath: rel,
          absPath: abs,
          mtimeMs: st.mtimeMs,
          size: st.size,
        });
      } catch {}
    }
  }

  children.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name, "zh-CN");
  });

  return children;
}

export async function buildTree(
  rootAbs: string,
  extensions = DEFAULT_EXTENSIONS,
): Promise<FileTree> {
  const rootName = path.basename(rootAbs);
  const items = await scanDir(rootAbs, "", rootAbs, extensions);
  return { rootAbs, rootName, generatedAt: Date.now(), items };
}

export async function readMarkdownFile(
  absPath: string,
  rootAbs: string,
  extensions = DEFAULT_EXTENSIONS,
): Promise<MarkdownFile> {
  if (!path.isAbsolute(absPath)) {
    throw new Error("path 必须是绝对路径");
  }
  if (!isMarkdownPath(absPath, extensions)) {
    throw new Error("仅支持读取 Markdown 扩展名文件");
  }

  const st = await fs.stat(absPath);
  const content = await fs.readFile(absPath, "utf8");

  const relPath = absPath === rootAbs
    ? ""
    : isSubpath(rootAbs, absPath)
      ? path.relative(rootAbs, absPath)
      : null;

  return {
    absPath,
    relPath: relPath ? relPath.replaceAll("\\", "/") : relPath,
    mtimeMs: st.mtimeMs,
    size: st.size,
    content,
  };
}
