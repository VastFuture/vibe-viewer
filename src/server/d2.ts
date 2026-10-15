import { spawn } from "node:child_process";

export const MAX_D2_SOURCE_BYTES = 100 * 1024;
const MAX_D2_OUTPUT_BYTES = 5 * 1024 * 1024;
const MAX_D2_ERROR_BYTES = 64 * 1024;
const D2_TIMEOUT_MS = 10_000;
const MAX_D2_PROCESSES = 4;
const MAX_PENDING_D2_RENDERS = 100;
const activeProcesses = new Set<ReturnType<typeof spawn>>();
const pendingRenders: Array<{
  code: string;
  resolve: (svg: string) => void;
  reject: (error: D2RenderError) => void;
}> = [];

export class D2RenderError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = "D2RenderError";
  }
}

export function validateD2Source(code: unknown): string {
  if (typeof code !== "string" || !code.trim()) {
    throw new D2RenderError("D2 源码不能为空", 400);
  }
  if (Buffer.byteLength(code, "utf8") > MAX_D2_SOURCE_BYTES) {
    throw new D2RenderError("D2 源码不能超过 100 KB", 413);
  }
  if (code.includes("@")) {
    throw new D2RenderError("暂不支持 D2 imports 或 @ 语法", 400);
  }
  return code;
}

export function renderD2(code: string): Promise<string> {
  if (activeProcesses.size >= MAX_D2_PROCESSES) {
    if (pendingRenders.length >= MAX_PENDING_D2_RENDERS) {
      return Promise.reject(new D2RenderError("D2 渲染等待队列已满，请稍后重试", 429));
    }
    return new Promise((resolve, reject) => {
      pendingRenders.push({ code, resolve, reject });
    });
  }
  return startD2Render(code);
}

function startNextD2Render() {
  const next = pendingRenders.shift();
  if (!next) return;
  startD2Render(next.code).then(next.resolve, next.reject);
}

function startD2Render(code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("d2", ["--no-xml-tag", "--target=", "-", "-"], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: false,
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let settled = false;
    activeProcesses.add(child);

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      activeProcesses.delete(child);
      fn();
      startNextD2Render();
    };
    const fail = (error: D2RenderError) => finish(() => reject(error));
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      fail(new D2RenderError("D2 渲染超时", 504));
    }, D2_TIMEOUT_MS);

    child.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") {
        fail(new D2RenderError("未找到 D2 CLI，请先安装：https://d2lang.com/tour/install/", 503));
        return;
      }
      fail(new D2RenderError(`无法启动 D2 CLI：${err.message}`, 500));
    });
    child.stdout.on("data", (chunk: Buffer) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes > MAX_D2_OUTPUT_BYTES) {
        child.kill("SIGKILL");
        fail(new D2RenderError("D2 输出超过 5 MB", 422));
        return;
      }
      stdout.push(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderrBytes += chunk.length;
      if (stderrBytes > MAX_D2_ERROR_BYTES) {
        child.kill("SIGKILL");
        fail(new D2RenderError("D2 错误输出超过 64 KB", 422));
        return;
      }
      stderr.push(chunk);
    });
    child.on("close", (exitCode) => {
      if (settled) return;
      if (exitCode !== 0) {
        const detail = Buffer.concat(stderr).toString("utf8").trim();
        fail(new D2RenderError(detail || `D2 编译失败（退出码 ${exitCode}）`, 422));
        return;
      }
      const svg = Buffer.concat(stdout).toString("utf8");
      if (!svg.includes("<svg")) {
        fail(new D2RenderError("D2 未返回有效 SVG", 422));
        return;
      }
      finish(() => resolve(svg));
    });
    child.stdin.on("error", () => {});
    child.stdin.end(code);
  });
}

export function stopD2Renders() {
  const error = new D2RenderError("D2 渲染服务已停止", 503);
  for (const pending of pendingRenders.splice(0)) pending.reject(error);
  for (const child of activeProcesses) child.kill("SIGKILL");
  activeProcesses.clear();
}
