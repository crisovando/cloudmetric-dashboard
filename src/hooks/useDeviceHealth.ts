import { useEffect, useState } from "react";
import { useSocket } from "./useSocket";
import type { HealthData, ServerHealth } from "@/types/deviceHealth";

export const useDeviceHealth = () => {
  const [deviceHealth, setDeviceHealth] = useState<ServerHealth[]>([]);
  const [latest, setLatest] = useState<Map<string, HealthData> | null>(null);
  const { socket, isConnected } = useSocket();

  function handleDeviceHealthUpdate(data: ServerHealth) {
    const existingIndex = deviceHealth.findIndex(
      (d) => d.serverId === data.serverId,
    );
    if (existingIndex !== -1) {
      setDeviceHealth((prev) => {
        const updated = [...prev];
        updated[existingIndex] = data;
        return updated;
      });
    } else {
      setDeviceHealth((prev) => [...prev, data]);
    }

    setLatest((prev) => {
      if (!prev) return new Map([[data.serverId, data.health]]);
      const updatedMap = new Map(prev);
      updatedMap.set(data.serverId, data.health);
      return updatedMap;
    });
  }

  useEffect(() => {
    if (!socket) return;

    const onMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as ServerHealth;
        handleDeviceHealthUpdate(data);
      } catch (error) {
        console.warn("Error parsing websocket payload:", event.data, error);
      }
    };

    socket.addEventListener("message", onMessage);

    return () => {
      socket.removeEventListener("message", onMessage);
    };
  }, [socket]);

  return { deviceHealth, latest, isConnected };
};
