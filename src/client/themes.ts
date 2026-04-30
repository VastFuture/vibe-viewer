export interface ThemeDef {
  name: string;
  label: string;
  type: "dark" | "light";
  mermaid: "dark" | "default" | "neutral" | "forest" | "base";
  vars: Record<string, string>;
}

export const THEMES: ThemeDef[] = [
  /* ── 1. GitHub Dark (default) ── */
  {
    name: "github-dark",
    label: "GitHub Dark",
    type: "dark",
    mermaid: "dark",
    vars: {
      "--bg-root":        "#0d1117",
      "--bg-panel":       "rgba(22,27,34,0.90)",
      "--bg-hover":       "rgba(177,186,196,0.08)",
      "--bg-active":      "rgba(88,166,255,0.12)",
      "--bg-input":       "rgba(0,0,0,0.28)",
      "--bg-code":        "rgba(110,118,129,0.15)",
      "--bg-pre":         "rgba(0,0,0,0.32)",
      "--bg-blockquote":  "rgba(88,166,255,0.08)",
      "--bg-th":          "rgba(255,255,255,0.05)",
      "--bg-bm":          "rgba(0,0,0,0.28)",

      "--border":         "rgba(177,186,196,0.16)",
      "--border-dashed":  "rgba(177,186,196,0.08)",
      "--border-active":  "rgba(88,166,255,0.35)",

      "--text":           "rgba(230,237,243,0.92)",
      "--text-heading":   "rgba(230,237,243,0.96)",
      "--text-muted":     "rgba(230,237,243,0.50)",
      "--text-code":      "rgba(230,237,243,0.90)",
      "--text-icon":      "rgba(230,237,243,0.60)",

      "--accent":                "#58a6ff",
      "--accent-bg":             "rgba(88,166,255,0.12)",
      "--accent-border":         "rgba(88,166,255,0.35)",
      "--accent-shadow":         "rgba(88,166,255,0.18)",
      "--accent-blockquote":     "rgba(88,166,255,0.50)",
      "--accent-input-focus":    "rgba(88,166,255,0.55)",

      "--danger":  "#f85149",
      "--shadow":  "0 18px 56px rgba(1,4,9,0.48)",

      "--gradient-c1":  "rgba(88,166,255,0.09)",
      "--gradient-c2":  "rgba(188,140,255,0.06)",
    },
  },

  /* ── 2. GitHub Light ── */
  {
    name: "github-light",
    label: "GitHub Light",
    type: "light",
    mermaid: "default",
    vars: {
      "--bg-root":        "#ffffff",
      "--bg-panel":       "rgba(255,255,255,0.92)",
      "--bg-hover":       "rgba(208,215,222,0.32)",
      "--bg-active":      "rgba(9,105,218,0.10)",
      "--bg-input":       "rgba(255,255,255,0.80)",
      "--bg-code":        "rgba(175,184,193,0.22)",
      "--bg-pre":         "rgba(0,0,0,0.03)",
      "--bg-blockquote":  "rgba(9,105,218,0.07)",
      "--bg-th":          "rgba(0,0,0,0.03)",
      "--bg-bm":          "rgba(0,0,0,0.03)",

      "--border":         "rgba(0,0,0,0.10)",
      "--border-dashed":  "rgba(0,0,0,0.06)",
      "--border-active":  "rgba(9,105,218,0.30)",

      "--text":           "rgba(31,35,40,0.92)",
      "--text-heading":   "rgba(31,35,40,0.95)",
      "--text-muted":     "rgba(31,35,40,0.50)",
      "--text-code":      "rgba(31,35,40,0.90)",
      "--text-icon":      "rgba(31,35,40,0.50)",

      "--accent":                "#0969da",
      "--accent-bg":             "rgba(9,105,218,0.10)",
      "--accent-border":         "rgba(9,105,218,0.30)",
      "--accent-shadow":         "rgba(9,105,218,0.12)",
      "--accent-blockquote":     "rgba(9,105,218,0.42)",
      "--accent-input-focus":    "rgba(9,105,218,0.40)",

      "--danger":  "#cf222e",
      "--shadow":  "0 12px 40px rgba(0,0,0,0.08)",

      "--gradient-c1":  "rgba(9,105,218,0.04)",
      "--gradient-c2":  "rgba(130,80,223,0.03)",
    },
  },

  /* ── 3. Nord ── */
  {
    name: "nord",
    label: "Nord",
    type: "dark",
    mermaid: "dark",
    vars: {
      "--bg-root":        "#2e3440",
      "--bg-panel":       "rgba(46,52,64,0.88)",
      "--bg-hover":       "rgba(216,222,233,0.06)",
      "--bg-active":      "rgba(136,192,208,0.14)",
      "--bg-input":       "rgba(0,0,0,0.22)",
      "--bg-code":        "rgba(0,0,0,0.22)",
      "--bg-pre":         "rgba(0,0,0,0.32)",
      "--bg-blockquote":  "rgba(136,192,208,0.08)",
      "--bg-th":          "rgba(216,222,233,0.06)",
      "--bg-bm":          "rgba(0,0,0,0.25)",

      "--border":         "rgba(216,222,233,0.14)",
      "--border-dashed":  "rgba(216,222,233,0.07)",
      "--border-active":  "rgba(136,192,208,0.35)",

      "--text":           "rgba(216,222,233,0.92)",
      "--text-heading":   "rgba(216,222,233,0.96)",
      "--text-muted":     "rgba(216,222,233,0.48)",
      "--text-code":      "rgba(216,222,233,0.90)",
      "--text-icon":      "rgba(216,222,233,0.58)",

      "--accent":                "#88c0d0",
      "--accent-bg":             "rgba(136,192,208,0.14)",
      "--accent-border":         "rgba(136,192,208,0.35)",
      "--accent-shadow":         "rgba(136,192,208,0.16)",
      "--accent-blockquote":     "rgba(136,192,208,0.50)",
      "--accent-input-focus":    "rgba(136,192,208,0.55)",

      "--danger":  "#bf616a",
      "--shadow":  "0 18px 56px rgba(0,0,0,0.42)",

      "--gradient-c1":  "rgba(136,192,208,0.10)",
      "--gradient-c2":  "rgba(180,142,173,0.07)",
    },
  },

  /* ── 4. Dracula ── */
  {
    name: "dracula",
    label: "Dracula",
    type: "dark",
    mermaid: "dark",
    vars: {
      "--bg-root":        "#1e1c29",
      "--bg-panel":       "rgba(40,42,54,0.90)",
      "--bg-hover":       "rgba(248,248,242,0.06)",
      "--bg-active":      "rgba(189,147,249,0.14)",
      "--bg-input":       "rgba(0,0,0,0.26)",
      "--bg-code":        "rgba(0,0,0,0.26)",
      "--bg-pre":         "rgba(0,0,0,0.36)",
      "--bg-blockquote":  "rgba(189,147,249,0.09)",
      "--bg-th":          "rgba(248,248,242,0.06)",
      "--bg-bm":          "rgba(0,0,0,0.28)",

      "--border":         "rgba(248,248,242,0.12)",
      "--border-dashed":  "rgba(248,248,242,0.07)",
      "--border-active":  "rgba(189,147,249,0.35)",

      "--text":           "rgba(248,248,242,0.90)",
      "--text-heading":   "rgba(248,248,242,0.95)",
      "--text-muted":     "rgba(248,248,242,0.48)",
      "--text-code":      "rgba(248,248,242,0.88)",
      "--text-icon":      "rgba(248,248,242,0.58)",

      "--accent":                "#bd93f9",
      "--accent-bg":             "rgba(189,147,249,0.14)",
      "--accent-border":         "rgba(189,147,249,0.35)",
      "--accent-shadow":         "rgba(189,147,249,0.18)",
      "--accent-blockquote":     "rgba(189,147,249,0.50)",
      "--accent-input-focus":    "rgba(189,147,249,0.55)",

      "--danger":  "#ff5555",
      "--shadow":  "0 18px 56px rgba(0,0,0,0.44)",

      "--gradient-c1":  "rgba(189,147,249,0.12)",
      "--gradient-c2":  "rgba(255,121,198,0.07)",
    },
  },

  /* ── 5. Catppuccin Mocha ── */
  {
    name: "catppuccin",
    label: "Catppuccin Mocha",
    type: "dark",
    mermaid: "dark",
    vars: {
      "--bg-root":        "#1e1e2e",
      "--bg-panel":       "rgba(30,30,46,0.88)",
      "--bg-hover":       "rgba(205,214,244,0.06)",
      "--bg-active":      "rgba(137,180,250,0.14)",
      "--bg-input":       "rgba(0,0,0,0.24)",
      "--bg-code":        "rgba(0,0,0,0.24)",
      "--bg-pre":         "rgba(0,0,0,0.32)",
      "--bg-blockquote":  "rgba(137,180,250,0.08)",
      "--bg-th":          "rgba(205,214,244,0.06)",
      "--bg-bm":          "rgba(0,0,0,0.25)",

      "--border":         "rgba(205,214,244,0.12)",
      "--border-dashed":  "rgba(205,214,244,0.07)",
      "--border-active":  "rgba(137,180,250,0.35)",

      "--text":           "rgba(205,214,244,0.92)",
      "--text-heading":   "rgba(205,214,244,0.96)",
      "--text-muted":     "rgba(205,214,244,0.48)",
      "--text-code":      "rgba(205,214,244,0.90)",
      "--text-icon":      "rgba(205,214,244,0.58)",

      "--accent":                "#89b4fa",
      "--accent-bg":             "rgba(137,180,250,0.14)",
      "--accent-border":         "rgba(137,180,250,0.35)",
      "--accent-shadow":         "rgba(137,180,250,0.18)",
      "--accent-blockquote":     "rgba(137,180,250,0.50)",
      "--accent-input-focus":    "rgba(137,180,250,0.55)",

      "--danger":  "#f38ba8",
      "--shadow":  "0 18px 56px rgba(0,0,0,0.42)",

      "--gradient-c1":  "rgba(137,180,250,0.12)",
      "--gradient-c2":  "rgba(245,194,231,0.08)",
    },
  },

  /* ── 6. Solarized Dark ── */
  {
    name: "solarized-dark",
    label: "Solarized Dark",
    type: "dark",
    mermaid: "dark",
    vars: {
      "--bg-root":        "#002b36",
      "--bg-panel":       "rgba(7,54,66,0.90)",
      "--bg-hover":       "rgba(131,148,150,0.08)",
      "--bg-active":      "rgba(42,161,152,0.14)",
      "--bg-input":       "rgba(0,0,0,0.24)",
      "--bg-code":        "rgba(0,0,0,0.22)",
      "--bg-pre":         "rgba(0,0,0,0.30)",
      "--bg-blockquote":  "rgba(42,161,152,0.08)",
      "--bg-th":          "rgba(131,148,150,0.06)",
      "--bg-bm":          "rgba(0,0,0,0.25)",

      "--border":         "rgba(131,148,150,0.16)",
      "--border-dashed":  "rgba(131,148,150,0.08)",
      "--border-active":  "rgba(42,161,152,0.35)",

      "--text":           "rgba(131,148,150,0.94)",
      "--text-heading":   "rgba(131,148,150,0.96)",
      "--text-muted":     "rgba(131,148,150,0.48)",
      "--text-code":      "rgba(131,148,150,0.92)",
      "--text-icon":      "rgba(131,148,150,0.56)",

      "--accent":                "#2aa198",
      "--accent-bg":             "rgba(42,161,152,0.14)",
      "--accent-border":         "rgba(42,161,152,0.35)",
      "--accent-shadow":         "rgba(42,161,152,0.16)",
      "--accent-blockquote":     "rgba(42,161,152,0.50)",
      "--accent-input-focus":    "rgba(42,161,152,0.55)",

      "--danger":  "#dc322f",
      "--shadow":  "0 18px 56px rgba(0,0,0,0.42)",

      "--gradient-c1":  "rgba(42,161,152,0.10)",
      "--gradient-c2":  "rgba(38,139,210,0.06)",
    },
  },

  /* ── 7. One Dark ── */
  {
    name: "one-dark",
    label: "One Dark",
    type: "dark",
    mermaid: "dark",
    vars: {
      "--bg-root":        "#282c34",
      "--bg-panel":       "rgba(33,37,43,0.90)",
      "--bg-hover":       "rgba(171,178,191,0.07)",
      "--bg-active":      "rgba(97,175,239,0.14)",
      "--bg-input":       "rgba(0,0,0,0.26)",
      "--bg-code":        "rgba(0,0,0,0.24)",
      "--bg-pre":         "rgba(0,0,0,0.34)",
      "--bg-blockquote":  "rgba(97,175,239,0.08)",
      "--bg-th":          "rgba(171,178,191,0.06)",
      "--bg-bm":          "rgba(0,0,0,0.28)",

      "--border":         "rgba(171,178,191,0.14)",
      "--border-dashed":  "rgba(171,178,191,0.07)",
      "--border-active":  "rgba(97,175,239,0.35)",

      "--text":           "rgba(171,178,191,0.92)",
      "--text-heading":   "rgba(171,178,191,0.96)",
      "--text-muted":     "rgba(171,178,191,0.48)",
      "--text-code":      "rgba(171,178,191,0.90)",
      "--text-icon":      "rgba(171,178,191,0.56)",

      "--accent":                "#61afef",
      "--accent-bg":             "rgba(97,175,239,0.14)",
      "--accent-border":         "rgba(97,175,239,0.35)",
      "--accent-shadow":         "rgba(97,175,239,0.18)",
      "--accent-blockquote":     "rgba(97,175,239,0.50)",
      "--accent-input-focus":    "rgba(97,175,239,0.55)",

      "--danger":  "#e06c75",
      "--shadow":  "0 18px 56px rgba(0,0,0,0.42)",

      "--gradient-c1":  "rgba(97,175,239,0.10)",
      "--gradient-c2":  "rgba(198,120,221,0.07)",
    },
  },

  /* ── 8. Monokai ── */
  {
    name: "monokai",
    label: "Monokai",
    type: "dark",
    mermaid: "dark",
    vars: {
      "--bg-root":        "#272822",
      "--bg-panel":       "rgba(39,40,34,0.90)",
      "--bg-hover":       "rgba(248,248,242,0.06)",
      "--bg-active":      "rgba(166,226,46,0.14)",
      "--bg-input":       "rgba(0,0,0,0.28)",
      "--bg-code":        "rgba(0,0,0,0.26)",
      "--bg-pre":         "rgba(0,0,0,0.36)",
      "--bg-blockquote":  "rgba(166,226,46,0.08)",
      "--bg-th":          "rgba(248,248,242,0.06)",
      "--bg-bm":          "rgba(0,0,0,0.28)",

      "--border":         "rgba(248,248,242,0.12)",
      "--border-dashed":  "rgba(248,248,242,0.07)",
      "--border-active":  "rgba(166,226,46,0.35)",

      "--text":           "rgba(248,248,242,0.90)",
      "--text-heading":   "rgba(248,248,242,0.95)",
      "--text-muted":     "rgba(248,248,242,0.48)",
      "--text-code":      "rgba(248,248,242,0.88)",
      "--text-icon":      "rgba(248,248,242,0.56)",

      "--accent":                "#a6e22e",
      "--accent-bg":             "rgba(166,226,46,0.14)",
      "--accent-border":         "rgba(166,226,46,0.35)",
      "--accent-shadow":         "rgba(166,226,46,0.18)",
      "--accent-blockquote":     "rgba(166,226,46,0.50)",
      "--accent-input-focus":    "rgba(166,226,46,0.55)",

      "--danger":  "#f92672",
      "--shadow":  "0 18px 56px rgba(0,0,0,0.44)",

      "--gradient-c1":  "rgba(166,226,46,0.10)",
      "--gradient-c2":  "rgba(102,217,239,0.06)",
    },
  },
];

export const DEFAULT_THEME = "github-light";
