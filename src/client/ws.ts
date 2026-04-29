interface WSMessage {
  type: string;
  absPath?: string;
  mtimeMs?: number;
}

interface WSHandlers {
  onMessage: (msg: WSMessage) => void;
  onStatus?: (status: "connecting" | "open" | "closed") => void;
}

export function connectWS(handlers: WSHandlers) {
  const { onMessage, onStatus } = handlers;
  let ws: WebSocket | null = null;
  let closedByUser = false;
  let reconnectTimer: number | null = null;

  function setStatus(s: "connecting" | "open" | "closed") {
    onStatus?.(s);
  }

  function connect() {
    if (closedByUser) return;
    setStatus("connecting");
    ws = new WebSocket(`ws://${location.host}/ws`);
    ws.addEventListener("open", () => {
      setStatus("open");
    });
    ws.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as WSMessage;
        onMessage(msg);
      } catch {}
    });
    ws.addEventListener("close", () => {
      setStatus("closed");
      ws = null;
      if (closedByUser) return;
      reconnectTimer = window.setTimeout(connect, 800);
    });
  }

  connect();

  return {
    close() {
      closedByUser = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      ws?.close();
      ws = null;
    },
  };
}
