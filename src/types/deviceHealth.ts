export const HealthStatus = {
  HEALTHY: "healthy",
  WARNING: "warning",
  CRITICAL: "critical",
} as const;

export type HealthStatus = typeof HealthStatus[keyof typeof HealthStatus];

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
