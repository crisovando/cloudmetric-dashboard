import { type FC, useState } from "react";
import { cn } from "../utils/utils";
import {
  X,
  Cpu,
  Thermometer,
  Database,
  Network,
  AlertTriangle,
  Lock,
  Unlock,
} from "lucide-react";
import type { ServerData } from "../hooks/useDeviceHealth";
import type { MetricName } from "../types/deviceHealth";

interface ControlPanelProps {
  server: ServerData | null;
  isOpen: boolean;
  onClose: () => void;
  onSendCommand: (command: ControlCommand) => void;
}

export interface ControlCommand {
  server_id: string;
  command: "set_failure_probability" | "set_metric" | "release_metric";
  metric?: MetricName;
  value?: number;
}

interface MetricConfig {
  key: MetricName;
  label: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const METRICS: MetricConfig[] = [
  {
    key: "cpu",
    label: "CPU",
    icon: <Cpu className="w-4 h-4" />,
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
  },
  {
    key: "temp",
    label: "Temperature",
    icon: <Thermometer className="w-4 h-4" />,
    min: 30,
    max: 95,
    step: 0.5,
    unit: "°C",
  },
  {
    key: "memory",
    label: "Memory",
    icon: <Database className="w-4 h-4" />,
    min: 0.5,
    max: 32,
    step: 0.5,
    unit: "GB",
  },
  {
    key: "network_in",
    label: "Network In",
    icon: <Network className="w-4 h-4" />,
    min: 0,
    max: 1000,
    step: 10,
    unit: "Mbps",
  },
  {
    key: "network_out",
    label: "Network Out",
    icon: <Network className="w-4 h-4" />,
    min: 0,
    max: 1000,
    step: 10,
    unit: "Mbps",
  },
];

export const ControlPanel: FC<ControlPanelProps> = ({
  server,
  isOpen,
  onClose,
  onSendCommand,
}) => {
  const [localFailureProb, setLocalFailureProb] = useState(0.02);
  const [overrides, setOverrides] = useState<
    Record<MetricName, { enabled: boolean; value: number }>
  >({
    cpu: { enabled: false, value: 50 },
    temp: { enabled: false, value: 60 },
    memory: { enabled: false, value: 8 },
    network_in: { enabled: false, value: 100 },
    network_out: { enabled: false, value: 100 },
  });

  const handleFailureProbChange = (finalValue: number) => {
    if (server) {
      onSendCommand({
        server_id: server.server_id,
        command: "set_failure_probability",
        value: finalValue,
      });
    }
  };

  const handleToggleOverride = (metric: MetricName) => {
    const current = overrides[metric];
    const newEnabled = !current.enabled;

    setOverrides((prev) => ({
      ...prev,
      [metric]: { ...current, enabled: newEnabled },
    }));

    if (server) {
      if (newEnabled) {
        onSendCommand({
          server_id: server.server_id,
          command: "set_metric",
          metric,
          value: current.value,
        });
      } else {
        onSendCommand({
          server_id: server.server_id,
          command: "release_metric",
          metric,
        });
      }
    }
  };

  const handleValueChange = (metric: MetricName, value: number) => {
    setOverrides((prev) => ({
      ...prev,
      [metric]: { ...prev[metric], value },
    }));

    if (server && overrides[metric].enabled) {
      onSendCommand({
        server_id: server.server_id,
        command: "set_metric",
        metric,
        value,
      });
    }
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-30" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-md bg-zinc-900 border-l border-white/10 z-50 shadow-2xl",
          "transform transition-transform duration-300 ease-out",
          "flex flex-col overflow-hidden",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">Server Control</h2>
            <p className="text-md text-zinc-500 font-mono">{server?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Failure Probability
              </h3>
            </div>

            <div className="bg-zinc-800/50 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-400">Current</span>
                <span className="text-lg font-bold text-amber-400">
                  {(localFailureProb * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={localFailureProb * 100}
                onChange={(e) =>
                  setLocalFailureProb(Number(e.target.value) / 100)
                }
                onPointerUp={() => handleFailureProbChange(localFailureProb)}
                className="w-full h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-zinc-500">0%</span>
                <span className="text-[10px] text-zinc-500">50%</span>
                <span className="text-[10px] text-zinc-500">100%</span>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Metric Overrides
              </h3>
            </div>

            <div className="space-y-3">
              {METRICS.map((metric) => {
                const override = overrides[metric.key];
                return (
                  <div
                    key={metric.key}
                    className={cn(
                      "bg-zinc-800/50 rounded-2xl p-4 border transition-all",
                      override.enabled
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-white/5",
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400">{metric.icon}</span>
                        <span className="text-sm font-medium text-white">
                          {metric.label}
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggleOverride(metric.key)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all",
                          override.enabled
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-zinc-700/50 text-zinc-400 border-zinc-600 hover:bg-zinc-700",
                        )}
                      >
                        {override.enabled ? (
                          <Lock className="w-3 h-3" />
                        ) : (
                          <Unlock className="w-3 h-3" />
                        )}
                        {override.enabled ? "Locked" : "Free"}
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={metric.min}
                        max={metric.max}
                        step={metric.step}
                        value={override.value}
                        onChange={(e) =>
                          handleValueChange(metric.key, Number(e.target.value))
                        }
                        disabled={!override.enabled}
                        className={cn(
                          "flex-1 bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono",
                          "focus:outline-none focus:border-emerald-500/50",
                          "disabled:opacity-40 disabled:cursor-not-allowed",
                        )}
                      />
                      <span className="text-xs text-zinc-500 w-12">
                        {metric.unit}
                      </span>
                    </div>

                    {override.enabled && (
                      <div className="mt-2">
                        <input
                          type="range"
                          min={metric.min}
                          max={metric.max}
                          step={metric.step}
                          value={override.value}
                          onChange={(e) =>
                            handleValueChange(
                              metric.key,
                              Number(e.target.value),
                            )
                          }
                          className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-white/10 bg-zinc-900/80 backdrop-blur">
          <p className="text-[10px] text-zinc-500 text-center uppercase tracking-wider">
            Changes are applied in real-time
          </p>
        </div>
      </div>
    </>
  );
};
