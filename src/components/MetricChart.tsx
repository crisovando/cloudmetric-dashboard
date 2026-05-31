import { type FC, useState, useMemo } from "react";
import { cn } from "../utils/utils";
import { Cpu, Thermometer, Database, Network, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { MetricHistory } from "../hooks/useDeviceHealth";
import type { Thresholds } from "../types/deviceHealth";

interface MetricChartProps {
  history: MetricHistory[];
  thresholds: Thresholds | null;
}

type MetricKey = "cpu" | "temp" | "memory" | "network_in" | "network_out";

interface MetricConfig {
  key: MetricKey;
  label: string;
  icon: React.ReactNode;
  color: string;
  unit: string;
}

const METRICS: MetricConfig[] = [
  {
    key: "cpu",
    label: "CPU",
    icon: <Cpu className="w-3.5 h-3.5" />,
    color: "#10b981",
    unit: "%",
  },
  {
    key: "temp",
    label: "Temp",
    icon: <Thermometer className="w-3.5 h-3.5" />,
    color: "#3b82f6",
    unit: "°C",
  },
  {
    key: "memory",
    label: "Memory",
    icon: <Database className="w-3.5 h-3.5" />,
    color: "#8b5cf6",
    unit: "GB",
  },
  {
    key: "network_in",
    label: "Net In",
    icon: <Network className="w-3.5 h-3.5" />,
    color: "#f59e0b",
    unit: "Mbps",
  },
  {
    key: "network_out",
    label: "Net Out",
    icon: <Activity className="w-3.5 h-3.5" />,
    color: "#ef4444",
    unit: "Mbps",
  },
];

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const THRESHOLD_CONFIG = {
  cpu: { warning: "cpu_warning", critical: "cpu_critical" },
  temp: { warning: "temp_warning", critical: "temp_critical" },
  memory: { warning: "memory_warning", critical: "memory_critical" },
} as const satisfies Partial<
  Record<MetricKey, { warning: keyof Thresholds; critical: keyof Thresholds }>
>;

const TIME_WINDOW = 200;
const MAX_HISTORY_POINTS = 50;
const MIN_HISTORY_POINTS = 2;
const DOMAIN_PADDING_RATIO = 0.1;
const FALLBACK_PADDING = 5;

export const MetricChart: FC<MetricChartProps> = ({ history, thresholds }) => {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("cpu");

  const activeConfig = METRICS.find((m) => m.key === activeMetric)!;

  const activeThresholds = useMemo(() => {
    const config =
      THRESHOLD_CONFIG[activeMetric as keyof typeof THRESHOLD_CONFIG];

    if (!config || !thresholds) {
      return {
        warning: null,
        critical: null,
      };
    }

    return {
      warning: thresholds[config.warning],
      critical: thresholds[config.critical],
    };
  }, [activeMetric, thresholds]);

  const { warning: warningValue, critical: criticalValue } = activeThresholds;

  const hasEnoughData = history.length >= MIN_HISTORY_POINTS;

  const xDomain = useMemo<[number, number] | undefined>(() => {
    if (history.length < 1) return undefined;
    const firstTs = history[0].timestamp;
    const lastTs = history[history.length - 1].timestamp;

    if (history.length < MAX_HISTORY_POINTS) {
      return [firstTs, firstTs + TIME_WINDOW];
    } else {
      return [lastTs - TIME_WINDOW, lastTs];
    }
  }, [history]);

  const yDomain = useMemo<[number, number] | [string, string]>(() => {
    const values = history
      .map((h) => h[activeMetric])
      .filter((v): v is number => typeof v === "number" && !Number.isNaN(v));

    if (!values.length) {
      return ["auto", "auto"];
    }

    let min = Math.min(...values);
    let max = Math.max(...values);

    if (warningValue != null) {
      min = Math.min(min, warningValue);
      max = Math.max(max, warningValue);
    }

    if (criticalValue != null) {
      min = Math.min(min, criticalValue);
      max = Math.max(max, criticalValue);
    }

    if (activeMetric === "cpu") {
      min = 0;
      max = Math.max(max, 100);
    }

    const padding = (max - min) * DOMAIN_PADDING_RATIO || FALLBACK_PADDING;

    return [Math.max(0, min - padding), max + padding];
  }, [history, activeMetric, warningValue, criticalValue]);

  const chartData = useMemo(() => {
    const classify = (value: number) => {
      if (criticalValue != null && value >= criticalValue)
        return "critical" as const;
      if (warningValue != null && value >= warningValue)
        return "warning" as const;
      return "normal" as const;
    };

    const result: Array<{
      timestamp: number;
      normal: number | null;
      warning: number | null;
      critical: number | null;
    }> = [];

    for (const h of history) {
      const value = h[activeMetric] as number | undefined;
      const timestamp = h.timestamp;

      if (typeof value !== "number" || Number.isNaN(value)) {
        result.push({ timestamp, normal: null, warning: null, critical: null });
        continue;
      }

      const zone = classify(value);
      const prev = result[result.length - 1];

      if (prev && prev.timestamp === timestamp) {
        // Bridge point already inserted for this timestamp, just add zone value
        if (zone === "critical") prev.critical = value;
        else if (zone === "warning") prev.warning = value;
        else prev.normal = value;
        continue;
      }

      // Detect segment transition and insert bridge point
      if (prev) {
        const prevZone =
          prev.critical != null
            ? "critical"
            : prev.warning != null
              ? "warning"
              : prev.normal != null
                ? "normal"
                : null;
        if (prevZone && prevZone !== zone) {
          const bridge = {
            timestamp,
            normal: null as number | null,
            warning: null as number | null,
            critical: null as number | null,
          };
          if (prevZone === "normal") bridge.normal = value;
          else if (prevZone === "warning") bridge.warning = value;
          else bridge.critical = value;
          result.push(bridge);
        }
      }

      result.push({
        timestamp,
        normal: zone === "normal" ? value : null,
        warning: zone === "warning" ? value : null,
        critical: zone === "critical" ? value : null,
      });
    }

    return result;
  }, [history, activeMetric, warningValue, criticalValue]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
          History
        </p>
        <p className="text-[10px] text-zinc-600">
          {history.length} / {MAX_HISTORY_POINTS} points
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4">
        {METRICS.map((metric) => (
          <button
            key={metric.key}
            onClick={() => setActiveMetric(metric.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
              activeMetric === metric.key
                ? "bg-white/10 text-white border border-white/20 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent",
            )}
          >
            {metric.icon}
            {metric.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      {(warningValue != null || criticalValue != null) && (
        <div className="flex items-center gap-4 mb-2">
          {warningValue != null && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0 border-t-2 border-dashed border-amber-500" />
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider">
                Warn {warningValue}
              </span>
            </div>
          )}
          {criticalValue != null && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0 border-t-2 border-red-500" />
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider">
                Crit {criticalValue}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="h-44 w-full">
        {hasEnoughData && xDomain ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />

              <XAxis
                type="number"
                dataKey="timestamp"
                domain={xDomain}
                tickFormatter={formatTime}
                stroke="rgba(255,255,255,0.2)"
                tick={{
                  fill: "rgba(255,255,255,0.3)",
                  fontSize: 9,
                }}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke="rgba(255,255,255,0.2)"
                tick={{
                  fill: "rgba(255,255,255,0.3)",
                  fontSize: 9,
                }}
                tickLine={false}
                axisLine={false}
                domain={yDomain}
                width={35}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const entry = payload.find((p) => p.value != null);
                    if (!entry) return null;
                    const value = entry.value as number;

                    return (
                      <div className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 shadow-xl">
                        <p className="text-[10px] text-zinc-400 mb-1">
                          {formatTime(label as number)}
                        </p>

                        <p
                          className="text-xs font-bold"
                          style={{ color: entry.color }}
                        >
                          {value.toFixed(2)} {activeConfig.unit}
                        </p>
                      </div>
                    );
                  }

                  return null;
                }}
              />

              {warningValue != null && (
                <ReferenceLine
                  y={warningValue}
                  stroke="#f59e0b"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                />
              )}

              {criticalValue != null && (
                <ReferenceLine
                  y={criticalValue}
                  stroke="#ef4444"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                />
              )}

              <Line
                type="monotone"
                dataKey="normal"
                stroke={activeConfig.color}
                strokeWidth={2.5}
                dot={false}
                connectNulls={false}
                activeDot={{
                  r: 5,
                  fill: activeConfig.color,
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="warning"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={false}
                connectNulls={false}
                activeDot={{
                  r: 5,
                  fill: "#f59e0b",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="critical"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={false}
                connectNulls={false}
                activeDot={{
                  r: 5,
                  fill: "#ef4444",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-600 text-xs">
            Cargando...
          </div>
        )}
      </div>
    </div>
  );
};
