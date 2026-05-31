import type { HealthStatus, MetricName, Thresholds } from '@/types/deviceHealth';
import { useState, useEffect, useRef, useCallback } from 'react';

export interface ServerData {
  server_id: string;
  name: string;
  timestamp: number;
  cpu: number;
  memory: number;
  temp: number;
  network_in: number;
  network_out: number;
  uptime: number;
  status: HealthStatus;
  thresholds: Thresholds;
}

export interface MetricHistory {
  timestamp: number;
  cpu: number;
  memory: number;
  temp: number;
  network_in: number;
  network_out: number;
}

type WsMessage =
  | { type: 'Snapshot'; payload: { servers: ServerData[] } }
  | { type: 'Update'; payload: ServerData }
  | { type: 'Deleted'; payload: { server_id: string } };

export interface ControlCommand {
  server_id: string;
  command: "set_failure_probability" | "set_metric" | "release_metric";
  metric?: MetricName;
  value?: number;
}

export function useServers() {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [thresholds, setThresholds] = useState<Thresholds | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryDelayRef = useRef(1000);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmountingRef = useRef(false);
  const [history, setHistory] = useState<Map<string, MetricHistory[]>>(new Map());

  const MAX_HISTORY_POINTS = 100;

  const MAX_RECONNECT_ATTEMPTS = 5;

  const sendCommand = useCallback((command: ControlCommand) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: "Command",
        payload: command,
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    isUnmountingRef.current = false;

    const connect = () => {
      const ws = new WebSocket('ws://localhost:8080/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setReconnectAttempts(0);
        retryDelayRef.current = 1000;
      };

      ws.onclose = () => {
        setIsConnected(false);
        
        if (!isUnmountingRef.current) {
          setReconnectAttempts(prev => {
            const newAttempts = prev + 1;
            
            if (newAttempts < MAX_RECONNECT_ATTEMPTS) {
              const delay = retryDelayRef.current;
              console.log(`WebSocket disconnected. Reconnecting in ${delay}ms... (attempt ${newAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
              
              reconnectTimeoutRef.current = setTimeout(() => {
                retryDelayRef.current = Math.min(delay * 2, 30000);
                connect();
              }, delay);
            } else {
              console.log(`WebSocket disconnected. Max reconnection attempts reached (${MAX_RECONNECT_ATTEMPTS}). Click "Reconnect" to try again.`);
            }
            
            return newAttempts;
          });
        }
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data) as WsMessage;

        setServers((prevServers) => {
          switch (message.type) {
            case 'Snapshot': {
              const servers = message.payload.servers;
              // Reset history on snapshot
              const newHistory = new Map<string, MetricHistory[]>();
              servers.forEach(s => {
                newHistory.set(s.server_id, [{
                  timestamp: s.timestamp,
                  cpu: s.cpu,
                  memory: s.memory,
                  temp: s.temp,
                  network_in: s.network_in,
                  network_out: s.network_out,
                }]);
              });
              setHistory(newHistory);
              // Extract thresholds from first server (they are global)
              if (servers.length > 0) {
                setThresholds(servers[0].thresholds);
              }
              return servers;
            }

            case 'Update': {
              const updated = message.payload;
              const serverId = updated.server_id;
              
              // Update thresholds from any update (they are global)
              setThresholds(updated.thresholds);
              
              // Update history
              setHistory(prevHistory => {
                const newHistory = new Map(prevHistory);
                const serverHistory = newHistory.get(serverId) || [];
                const updatedHistory = [...serverHistory, {
                  timestamp: updated.timestamp,
                  cpu: updated.cpu,
                  memory: updated.memory,
                  temp: updated.temp,
                  network_in: updated.network_in,
                  network_out: updated.network_out,
                }];
                // Keep only last 30 points
                if (updatedHistory.length > MAX_HISTORY_POINTS) {
                  updatedHistory.shift();
                }
                newHistory.set(serverId, updatedHistory);
                return newHistory;
              });
              
              const exists = prevServers.some(s => s.server_id === serverId);
              if (exists) {
                return prevServers.map(s =>
                  s.server_id === serverId ? updated : s
                );
              }
              return [...prevServers, updated];
            }

            case 'Deleted': {
              setHistory(prevHistory => {
                const newHistory = new Map(prevHistory);
                newHistory.delete(message.payload.server_id);
                return newHistory;
              });
              return prevServers.filter(s => s.server_id !== message.payload.server_id);
            }

            default:
              return prevServers;
          }
        });
      };
    };

    const reconnect = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      setReconnectAttempts(0);
      retryDelayRef.current = 1000;
      connect();
    };

    // Expose reconnect function via ref
    reconnectRef.current = reconnect;

    connect();

    return () => {
      isUnmountingRef.current = true;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const reconnectRef = useRef<(() => void) | null>(null);

  const reconnect = useCallback(() => {
    reconnectRef.current?.();
  }, []);

  const getServerHistory = useCallback((serverId: string): MetricHistory[] => {
    return history.get(serverId) || [];
  }, [history]);

  const hasExhaustedReconnects = !isConnected && reconnectAttempts >= MAX_RECONNECT_ATTEMPTS;

  return { 
    servers, 
    isConnected, 
    sendCommand,
    reconnect,
    hasExhaustedReconnects,
    reconnectAttempts,
    getServerHistory,
    thresholds 
  };
}
