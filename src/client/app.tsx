import { createRoot } from "react-dom/client";
import { App } from "./components/App.js";
import { THEMES, DEFAULT_THEME } from "./themes.js";

// Apply saved theme immediately to prevent flash
function applyTheme() {
  let themeName = DEFAULT_THEME;
  try {
    const raw = localStorage.getItem("vv:settings");
    if (raw) {
      const obj = JSON.parse(raw);
      themeName = obj.theme ?? DEFAULT_THEME;
    }
  } catch {}
  const themeDef = THEMES.find((t) => t.name === themeName);
  if (themeDef) {
    const root = document.documentElement;
    for (const [key, val] of Object.entries(themeDef.vars)) {
      root.style.setProperty(key, val);
    }
  }
}

applyTheme();

const el = document.getElementById("root");
if (!el) throw new Error("#root 不存在");

createRoot(el).render(<App />);
