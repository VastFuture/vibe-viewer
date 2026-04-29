export function posixDirname(absPath: string) {
  const p = absPath.replaceAll("\\", "/");
  const idx = p.lastIndexOf("/");
  if (idx <= 0) return "/";
  return p.slice(0, idx);
}

export function posixNormalize(p: string) {
  const raw = p.replaceAll("\\", "/");
  const isAbs = raw.startsWith("/");
  const parts = raw.split("/").filter((x) => x.length > 0);
  const stack: string[] = [];
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") {
      if (stack.length > 0) stack.pop();
      continue;
    }
    stack.push(part);
  }
  const joined = (isAbs ? "/" : "") + stack.join("/");
  return joined || (isAbs ? "/" : ".");
}

export function posixJoin(a: string, b: string) {
  if (!a) return b;
  if (!b) return a;
  if (b.startsWith("/")) return b;
  const left = a.endsWith("/") ? a.slice(0, -1) : a;
  const right = b.startsWith("/") ? b.slice(1) : b;
  return posixNormalize(`${left}/${right}`);
}

export function looksLikeAbsoluteFsPath(url: string) {
  return (
    url.startsWith("/Users/") ||
    url.startsWith("/Volumes/") ||
    url.startsWith("/private/") ||
    url.startsWith("/opt/") ||
    url.startsWith("/var/")
  );
}

export function splitHref(href: string) {
  const raw = href.trim();
  const hashIdx = raw.indexOf("#");
  const qIdx = raw.indexOf("?");
  let pathPart = raw;
  let hash = "";
  let query = "";

  if (hashIdx >= 0) {
    pathPart = raw.slice(0, hashIdx);
    hash = raw.slice(hashIdx);
  }

  const q = pathPart.indexOf("?");
  if (q >= 0) {
    query = pathPart.slice(q);
    pathPart = pathPart.slice(0, q);
  } else if (qIdx >= 0 && hashIdx >= 0 && qIdx < hashIdx) {
    query = raw.slice(qIdx, hashIdx);
  }

  return { pathPart, query, hash };
}
