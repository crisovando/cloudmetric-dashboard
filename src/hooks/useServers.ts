import { useEffect, useState, useRef, useCallback } from "react";

import { CloudMetricSocket } from "@/services/websockets";

import type {
  ServerData,
  AlertEvent,
  Thresholds,
  WsEvent,
  WsCommand,
} from "@/types/websockets";

export function useServers() {
  const socketRef = useRef<CloudMetricSocket>(null);

  const [servers, setServers] = useState<ServerData[]>([]);

  const [alerts, setAlerts] = useState<AlertEvent[]>([]);

  const [connected, setConnected] = useState(false);

  const [thresholds, setThresholds] = useState<Thresholds | null>(null);

  useEffect(() => {
    const socket = new CloudMetricSocket();

    socketRef.current = socket;

    socket.subscribe(handleEvent);

    socket.onStatus(setConnected);

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  function handleEvent(event: WsEvent) {
    switch (event.type) {
      case "Snapshot":
        setServers(event.payload.servers);

        setAlerts(event.payload.alerts);

        if (event.payload.servers.length)
          setThresholds(event.payload.servers[0].thresholds);

        break;

      case "Update":
        setServers((prev) => {
          const exists = prev.some(
            (x) => x.server_id === event.payload.server_id,
          );

          return exists
            ? prev.map((x) =>
                x.server_id === event.payload.server_id ? event.payload : x,
              )
            : [...prev, event.payload];
        });

        break;

      case "Deleted":
        setServers((prev) =>
          prev.filter((x) => x.server_id !== event.payload.server_id),
        );

        break;

      case "Alert":
        setAlerts((prev) => [...prev, event.payload].slice(-100));

        break;

      case "Recovery":
        setAlerts((prev) =>
          prev.map((a) =>
            a.server_id === event.payload.server_id && a.resolved_at === null
              ? {
                  ...a,
                  resolved_at: Math.floor(Date.now() / 1000),
                }
              : a,
          ),
        );

        break;
    }
  }

  const sendCommand = useCallback((cmd: WsCommand["payload"]) => {
    socketRef.current?.send({
      type: "Command",
      payload: cmd,
    });
  }, []);

  const reconnect = useCallback(() => {
    socketRef.current?.reconnect();
  }, []);

  return {
    servers,

    alerts,

    thresholds,

    isConnected: connected,

    sendCommand,

    reconnect,
  };
}
