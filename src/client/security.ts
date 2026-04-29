import DOMPurify from "dompurify";

export function sanitizeIfNeeded(html: string, securityLevel: string) {
  if (securityLevel !== "allow-html") return html;
  try {
    const DOMPurifyAny = DOMPurify as any;
    if (typeof DOMPurifyAny?.sanitize === "function") {
      return DOMPurifyAny.sanitize(html, { USE_PROFILES: { html: true } });
    }
    if (typeof window !== "undefined" && typeof DOMPurifyAny === "function") {
      const purifier = DOMPurifyAny(window);
      if (typeof purifier?.sanitize === "function") {
        return purifier.sanitize(html, { USE_PROFILES: { html: true } });
      }
    }
  } catch {}
  return html;
}

export function isBlockedProtocol(url: string) {
  const lower = url.trim().toLowerCase();
  return lower.startsWith("javascript:") || lower.startsWith("vbscript:");
}
