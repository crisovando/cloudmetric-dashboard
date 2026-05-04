import { useEffect, useState } from "react";

const WS_URL =
  import.meta.env.NODE_ENV === "production"
    ? `ws://${window.location.host}/ws`
    : "ws://localhost:8080/ws";

interface UseSocketResult {
  socket: WebSocket | null;
  isConnected: boolean;
}

export const useSocket = (): UseSocketResult => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setIsConnected(false);

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  return { socket, isConnected };
};
