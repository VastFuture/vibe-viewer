import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import open from "open";
import prompts from "prompts";
import { startServer } from "./server/index.js";

function parseArgs(argv: string[]) {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") { out.help = true; continue; }
    if (a === "--no-open") { out.noOpen = true; continue; }
    if (a === "--dir") { out.dir = argv[i + 1]; i++; continue; }
    if (a.startsWith("--dir=")) { out.dir = a.slice("--dir=".length); continue; }
    if (!a.startsWith("-") && !out.dir) { out.dir = a; continue; }
  }
  return out;
}

function printHelp() {
  const lines = [
    "vibe-viewer - Markdown 本地浏览器（Mermaid.js）",
    "",
    "用法：",
    "  npx vibe-viewer",
    "  npx vibe-viewer --dir <path>",
    "",
    "参数：",
    "  --dir <path>     Root 目录；不传则进入交互输入",
    "  --no-open        不自动打开浏览器",
    "  -h, --help       显示帮助",
  ];
  console.log(lines.join("\n"));
}

async function ensureDirAbs(input?: string) {
  const raw = (input ?? "").trim();
  const dir = raw ? path.resolve(process.cwd(), raw) : process.cwd();
  const st = await fs.stat(dir);
  if (!st.isDirectory()) throw new Error("不是目录");
  return dir;
}

async function askDirInteractively() {
  const ans = await prompts(
    {
      type: "text",
      name: "dir",
      message: "请选择要浏览的目录（支持相对路径，默认当前目录）",
      initial: process.cwd(),
      validate: async (value: string) => {
        try {
          await ensureDirAbs(value);
          return true;
        } catch {
          return "目录不存在或不可访问";
        }
      },
    },
    {
      onCancel: () => {
        process.exit(1);
      },
    },
  );
  return String(ans.dir ?? "");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const dirInput = args.dir ?? (await askDirInteractively());
  const rootAbs = await ensureDirAbs(String(dirInput));
  const shouldOpen = !args.noOpen;

  const { port, close } = await startServer({ rootAbs });
  const url = `http://127.0.0.1:${port}/`;
  console.log(`Root: ${rootAbs}`);
  console.log(`URL:  ${url}`);

  const shutdown = async () => {
    try {
      await close();
    } finally {
      process.exit(0);
    }
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  if (shouldOpen) {
    try {
      await open(url);
    } catch (err) {
      console.error("打开浏览器失败，请手动访问：", url);
      console.error(String(err));
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
