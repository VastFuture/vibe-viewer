import { useMemo, useState } from "react";
import type { TreeItem } from "../../server/api.js";

interface TreeProps {
  items: TreeItem[];
  filter: string;
  currentAbsPath: string | null;
  onOpen: (absPath: string) => void;
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

export function Tree({ items, filter, currentAbsPath, onOpen }: TreeProps) {
  const needleLower = filter.trim().toLowerCase();
  const filtered = useMemo(() => filterTree(items, needleLower), [items, needleLower]);
  const [openDirs, setOpenDirs] = useState<Set<string>>(() => new Set());

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
              className="tree__item"
              style={padStyle}
              onClick={() => toggleDir(it.relPath)}
            >
              <div className="tree__icon">{opened ? "-" : "+"}</div>
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
        >
          <div className="tree__icon">{"\u00B7"}</div>
          <div className="tree__name">{it.name}</div>
        </div>
      );
    });
  }

  return <div>{renderItems(filtered, 0)}</div>;
}
