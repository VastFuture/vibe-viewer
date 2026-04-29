import { Tree } from "./Tree.js";
import type { FileTree, TreeItem } from "../../server/api.js";

interface SidebarProps {
  tree: FileTree | null;
  filter: string;
  currentAbsPath: string | null;
  onOpen: (absPath: string) => void;
}

export function Sidebar({ tree, filter, currentAbsPath, onOpen }: SidebarProps) {
  if (!tree) return <div className="tree empty">加载文件树中...</div>;
  if (tree.items.length === 0)
    return <div className="tree empty">该目录下没有可浏览的 Markdown 文件</div>;

  return (
    <div className="tree">
      <Tree items={tree.items} filter={filter} currentAbsPath={currentAbsPath} onOpen={onOpen} />
    </div>
  );
}
