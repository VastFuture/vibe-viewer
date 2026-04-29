import { posixDirname, posixJoin, posixNormalize, looksLikeAbsoluteFsPath, splitHref } from "./paths.js";
import { isBlockedProtocol } from "./security.js";

interface RewriteOpts {
  rootAbs: string;
  currentAbsPath: string;
  openMarkdownFile: (absPath: string, hash?: string) => void;
  securityLevel: string;
}

function isExternalOrSafePassthrough(url: string) {
  const u = url.trim();
  return (
    u === "" ||
    u.startsWith("#") ||
    u.startsWith("http://") ||
    u.startsWith("https://") ||
    u.startsWith("data:") ||
    u.startsWith("mailto:") ||
    u.startsWith("tel:")
  );
}

function isMarkdownLike(p: string) {
  const lower = p.toLowerCase();
  return lower.endsWith(".md") || lower.endsWith(".mdx") || lower.endsWith(".markdown");
}

function resolveToAbsPath(
  urlPath: string,
  { rootAbs, currentAbsPath }: { rootAbs: string; currentAbsPath: string },
) {
  const trimmed = urlPath.trim().replaceAll("\\", "/");
  if (trimmed.startsWith("/")) {
    if (looksLikeAbsoluteFsPath(trimmed)) return posixNormalize(trimmed);
    const underRoot = posixJoin(rootAbs, trimmed.replace(/^\/+/, ""));
    return posixNormalize(underRoot);
  }
  const baseDir = posixDirname(currentAbsPath);
  return posixNormalize(posixJoin(baseDir, trimmed));
}

function rawUrl(absPath: string) {
  return `/raw?path=${encodeURIComponent(absPath)}`;
}

export function rewriteLocalAssets(container: HTMLElement, opts: RewriteOpts) {
  const { rootAbs, currentAbsPath, openMarkdownFile, securityLevel } = opts;

  // Rewrite image/video/audio/source src attributes
  const srcNodes = container.querySelectorAll("img[src], video[src], audio[src], source[src]");
  for (const node of srcNodes) {
    const el = node as HTMLElement;
    const src = el.getAttribute("src") ?? "";

    if (isBlockedProtocol(src)) {
      if (securityLevel === "allow-all") continue;
      el.removeAttribute("src");
      continue;
    }

    if (securityLevel === "strict" && src.trim().toLowerCase().startsWith("data:")) {
      el.removeAttribute("src");
      continue;
    }

    if (isExternalOrSafePassthrough(src)) continue;

    const { pathPart } = splitHref(src);
    if (!pathPart) continue;

    const abs = resolveToAbsPath(pathPart, { rootAbs, currentAbsPath });
    const shouldFallback = pathPart.startsWith("/") && !looksLikeAbsoluteFsPath(pathPart);
    const primary = rawUrl(abs);
    el.setAttribute("src", primary);

    if (shouldFallback && node.tagName.toLowerCase() === "img") {
      const img = node as HTMLImageElement;
      const fallbackAbs = posixNormalize(pathPart);
      let triedFallback = false;
      img.addEventListener("error", () => {
        if (triedFallback) return;
        triedFallback = true;
        img.src = rawUrl(fallbackAbs);
      });
    }
  }

  // Rewrite anchor hrefs
  const links = container.querySelectorAll("a[href]");
  for (const node of links) {
    const a = node as HTMLAnchorElement;
    const href = a.getAttribute("href") ?? "";

    if (isExternalOrSafePassthrough(href)) continue;

    if (securityLevel === "strict" && href.trim().toLowerCase().startsWith("data:")) {
      a.setAttribute("href", "#");
      continue;
    }

    if (isBlockedProtocol(href)) {
      if (securityLevel === "allow-all") continue;
      a.setAttribute("href", "#");
      continue;
    }

    const { pathPart, hash } = splitHref(href);
    if (!pathPart) continue;

    const abs = resolveToAbsPath(pathPart, { rootAbs, currentAbsPath });

    if (isMarkdownLike(pathPart)) {
      a.setAttribute("href", "#");
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        openMarkdownFile(abs, hash || undefined);
      });
      continue;
    }

    a.setAttribute("href", rawUrl(abs));
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noreferrer");
  }
}
