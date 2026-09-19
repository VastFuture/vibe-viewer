import { useEffect, useMemo, useRef, useState } from "react";
import type { TreeItem } from "../../server/api.js";

interface TreeProps {
  items: TreeItem[];
  filter: string;
  currentAbsPath: string | null;
  onOpen: (absPath: string) => void;
  autoLocate: boolean;
  locateTrigger?: number;
}

function filterTree(items: TreeItem[], needleLower: string): TreeItem[] {
  if (!needleLower) return items;
  const out: TreeItem[] = [];
  for (const it of items) {
    if (it.type === "file") {
      const hay = `${it.name} ${it.relPath}`.toLowerCase();
      if (hay.includes(needleLower)) out.push(it);
      continue;
    }
    const sub = filterTree(it.children!, needleLower);
    if (sub.length > 0) out.push({ ...it, children: sub });
  }
  return out;
}

function getFileIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".gif") || lower.endsWith(".svg") || lower.endsWith(".webp") || lower.endsWith(".ico")) {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }
  if (lower.endsWith(".html") || lower.endsWith(".htm")) {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    );
  }
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export function Tree({ items, filter, currentAbsPath, onOpen, autoLocate, locateTrigger }: TreeProps) {
  const needleLower = filter.trim().toLowerCase();
  const filtered = useMemo(() => filterTree(items, needleLower), [items, needleLower]);
  const [openDirs, setOpenDirs] = useState<Set<string>>(() => new Set());
  const itemRef = useRef<HTMLDivElement>(null);

  // 查找当前文件的所有父目录路径
  function findParentDirs(items: TreeItem[], targetAbsPath: string, parents: string[] = []): string[] | null {
    for (const it of items) {
      if (it.type === "file" && it.absPath === targetAbsPath) {
        return parents;
      }
      if (it.type === "dir") {
        const result = findParentDirs(it.children!, targetAbsPath, [...parents, it.relPath]);
        if (result) return result;
      }
    }
    return null;
  }

  // 自动定位：刷新或手动触发时展开路径
  useEffect(() => {
    if (!autoLocate || !currentAbsPath) return;
    
    const parents = findParentDirs(items, currentAbsPath);
    if (parents && parents.length > 0) {
      setOpenDirs(new Set(parents));
      
      // 延迟滚动到当前文件
      setTimeout(() => {
        const activeEl = document.querySelector('.tree__item--active');
        if (activeEl) {
          activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 100);
    }
  }, [currentAbsPath, items, autoLocate, locateTrigger]);

  function toggleDir(relPath: string) {
    setOpenDirs((s) => {
      const next = new Set(s);
      if (next.has(relPath)) next.delete(relPath);
      else next.add(relPath);
      return next;
    });
  }

  function renderItems(nodes: TreeItem[], depth: number) {
    return nodes.map((it) => {
      const padStyle = { paddingLeft: depth * 14 };

      if (it.type === "dir") {
        const opened = needleLower ? true : openDirs.has(it.relPath);
        return (
          <div key={it.relPath}>
            <div
              className="tree__item tree__item--dir"
              style={padStyle}
              onClick={() => toggleDir(it.relPath)}
            >
              <div className={`tree__chevron ${opened ? "tree__chevron--open" : ""}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
              <div className="tree__name">{it.name}</div>
            </div>
            {opened ? <div>{renderItems(it.children!, depth + 1)}</div> : null}
          </div>
        );
      }

      const active = currentAbsPath && it.absPath === currentAbsPath;
      return (
        <div
          key={it.absPath}
          className={`tree__item ${active ? "tree__item--active" : ""}`}
          style={padStyle}
          onClick={() => onOpen(it.absPath!)}
          ref={active ? itemRef : undefined}
        >
          <div className="tree__fileicon">
            {getFileIcon(it.name)}
          </div>
          <div className="tree__name">{it.name}</div>
        </div>
      );
    });
  }

  return <div>{renderItems(filtered, 0)}</div>;
}
