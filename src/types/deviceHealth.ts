export const HealthStatus = {
  HEALTHY: "Healthy",
  WARNING: "Warning",
  CRITICAL: "Critical",
  OFFLINE: "Offline",
} as const;

export type HealthStatus = typeof HealthStatus[keyof typeof HealthStatus];

export type MetricName = "cpu" | "temp" | "memory" | "network_in" | "network_out";

export type AlertMetric = "cpu" | "temp" | "memory" | "network" | "offline";

export interface Thresholds {
  cpu_warning: number;
  cpu_critical: number;
  temp_warning: number;
  temp_critical: number;
  memory_warning: number;
  memory_critical: number;
}

export interface AlertEvent {
  id: string;
  server_id: string;
  server_name: string;
  timestamp: number;
  metric: AlertMetric;
  value: number | null;
  resolved_at: number | null;
}

export interface RecoveryEvent {
  server_id: string;
  server_name: string;
}

export interface HealthData {
  timestamp: string;
  cpu: number;
  temp: number;
  memory: number;
  network: {
    in_value: number;
    out_value: number;
  };
  uptime: number;
  status: HealthStatus;
}

export interface ServerHealth {
  serverId: string;
  health: HealthData;
}

export type ServerHealthResponse = {
  payload: ServerHealth;
};
