export type HealthStatus = "Healthy" | "Warning" | "Critical" | "Offline";

export type AlertMetric = "cpu" | "temp" | "memory" | "network" | "offline";

export type MetricName =
  | "cpu"
  | "temp"
  | "memory"
  | "network_in"
  | "network_out";

export interface Thresholds {
  cpu_warning: number;
  cpu_critical: number;

  temp_warning: number;
  temp_critical: number;

  memory_warning: number;
  memory_critical: number;
}

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

export type WsEvent =
  | {
      type: "Snapshot";
      payload: {
        servers: ServerData[];
        alerts: AlertEvent[];
      };
    }
  | {
      type: "Update";
      payload: ServerData;
    }
  | {
      type: "Deleted";
      payload: {
        server_id: string;
      };
    }
  | {
      type: "Alert";
      payload: AlertEvent;
    }
  | {
      type: "Recovery";
      payload: RecoveryEvent;
    };

export type WsCommand = {
  type: "Command";
  payload: {
    server_id: string;

    command: "set_failure_probability" | "set_metric" | "release_metric";

    metric?: MetricName;

    value?: number;
  };
};
