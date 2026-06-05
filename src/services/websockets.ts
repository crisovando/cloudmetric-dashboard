import type { WsEvent, WsCommand } from "@/types/websockets";

const DEFAULT_WS_PORT = "8080";

export class CloudMetricSocket {
  private socket: WebSocket | null = null;

  private getUrl() {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.hostname || "localhost";
    const port = import.meta.env.VITE_WS_PORT || DEFAULT_WS_PORT;
    return `${protocol}://${host}:${port}/ws`;
  }
  private stopped = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private retries = 0;
  private maxRetries = 5;
  private onMessage: ((event: WsEvent) => void) | null = null;
  private onConnection: ((connected: boolean) => void) | null = null;

  connect() {
    this.stopped = false;
    this.open();
  }

  private open() {
    if (this.stopped) return;
    if (this.socket?.readyState === WebSocket.OPEN) return;
    if (this.socket?.readyState === WebSocket.CONNECTING) return;

    const ws = new WebSocket(this.getUrl());
    this.socket = ws;

    ws.onopen = () => {
      this.retries = 0;

      this.onConnection?.(true);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as WsEvent;

        this.onMessage?.(msg);
      } catch (err) {
        console.error("Invalid websocket message", err);
      }
    };

    ws.onerror = (e) => {
      console.error("Websocket error", e);
    };

    ws.onclose = () => {
      if (ws !== this.socket) {
        return;
      }

      this.socket = null;
      this.onConnection?.(false);

      if (this.stopped) return;

      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.retries >= this.maxRetries) {
      return;
    }
    const delay = Math.min(1000 * Math.pow(2, this.retries), 30000);

    this.retries++;
    this.reconnectTimer = setTimeout(() => this.open(), delay);
  }

  send(command: WsCommand) {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(JSON.stringify(command));
  }

  subscribe(handler: (e: WsEvent) => void) {
    this.onMessage = handler;
  }

  onStatus(handler: (connected: boolean) => void) {
    this.onConnection = handler;
  }

  reconnect() {
    this.disconnect();
    this.retries = 0;
    this.connect();
  }

  disconnect() {
    this.stopped = true;

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    const ws = this.socket;

    this.socket = null;

    if (ws?.readyState === WebSocket.OPEN) {
      ws.close(1000, "manual disconnect");
    }
  }
}
