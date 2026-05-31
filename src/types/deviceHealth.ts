export const HealthStatus = {
  HEALTHY: "healthy",
  WARNING: "warning",
  CRITICAL: "critical",
  OFFLINE: "offline",
} as const;

export type HealthStatus = typeof HealthStatus[keyof typeof HealthStatus];

export type MetricName = "cpu" | "temp" | "memory" | "network_in" | "network_out";

export interface Thresholds {
  cpu_warning: number;
  cpu_critical: number;
  temp_warning: number;
  temp_critical: number;
  memory_warning: number;
  memory_critical: number;
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
