import { DEFAULT_THEME } from "../themes.js";

export interface Settings {
  securityLevel: "allow-all" | "allow-html" | "strict";
  breaks: boolean;
  emoji: boolean;
  math: boolean;
  theme: string;
}

export const DEFAULT_SETTINGS: Settings = {
  securityLevel: "allow-all",
  breaks: false,
  emoji: true,
  math: true,
  theme: DEFAULT_THEME,
};

const SETTINGS_KEY = "vv:settings";
const LAST_FILE_KEY = "vv:lastFile";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const obj = JSON.parse(raw);
    return {
      securityLevel: obj.securityLevel ?? DEFAULT_SETTINGS.securityLevel,
      breaks: typeof obj.breaks === "boolean" ? obj.breaks : DEFAULT_SETTINGS.breaks,
      emoji: typeof obj.emoji === "boolean" ? obj.emoji : DEFAULT_SETTINGS.emoji,
      math: typeof obj.math === "boolean" ? obj.math : DEFAULT_SETTINGS.math,
      theme: obj.theme ?? DEFAULT_SETTINGS.theme,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function loadLastFile(): string | null {
  try {
    return localStorage.getItem(LAST_FILE_KEY);
  } catch {
    return null;
  }
}

export function saveLastFile(absPath: string) {
  try {
    localStorage.setItem(LAST_FILE_KEY, absPath);
  } catch {}
}
