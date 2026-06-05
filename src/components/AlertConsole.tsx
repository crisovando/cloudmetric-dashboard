import { useState } from "react";
import type { AlertEvent, AlertMetric } from "@/types/deviceHealth";
import { cn } from "@/utils/utils";
import {
  Cpu,
  Thermometer,
  Database,
  Network,
  WifiOff,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Trash2,
  CheckCircle2,
} from "lucide-react";

interface AlertConsoleProps {
  alerts: AlertEvent[];
  onClear: () => void;
}

const METRIC_ICONS: Record<AlertMetric, typeof Cpu> = {
  cpu: Cpu,
  temp: Thermometer,
  memory: Database,
  network: Network,
  offline: WifiOff,
};

const METRIC_LABELS: Record<AlertMetric, string> = {
  cpu: "CPU",
  temp: "Temp",
  memory: "Memory",
  network: "Network",
  offline: "Offline",
};

const METRIC_COLORS: Record<AlertMetric, string> = {
  cpu: "text-red-400",
  temp: "text-orange-400",
  memory: "text-purple-400",
  network: "text-yellow-400",
  offline: "text-zinc-400",
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function AlertConsole({ alerts, onClear }: AlertConsoleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        isExpanded ? "h-72" : "h-10"
      )}
    >
      <div className="h-full bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 flex flex-col">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-10 px-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer shrink-0"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Alert Console
            </span>
            {alerts.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-400 text-[10px] font-bold tabular-nums">
                {alerts.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {alerts.length > 0 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="p-1 rounded hover:bg-white/10 transition-colors text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </span>
            )}
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            ) : (
              <ChevronUp className="w-4 h-4 text-zinc-500" />
            )}
          </div>
        </button>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {alerts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-600 text-xs">
              No alerts recorded
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {[...alerts].reverse().map((alert, idx) => {
                const Icon = METRIC_ICONS[alert.metric] || AlertTriangle;
                const colorClass =
                  METRIC_COLORS[alert.metric] || "text-zinc-400";
                const isResolved = alert.resolved_at !== null;

                return (
                  <div
                    key={`${alert.id}-${idx}`}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 text-xs animate-slide-in",
                      idx === 0 && !isResolved && "bg-red-500/5",
                      isResolved && "opacity-50"
                    )}
                  >
                    {isResolved ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <Icon className={cn("w-3.5 h-3.5 shrink-0", colorClass)} />
                    )}

                    <span className="text-zinc-500 tabular-nums w-20 shrink-0">
                      {formatTime(alert.timestamp)}
                    </span>

                    <span className="font-mono text-zinc-300 truncate">
                      {alert.server_name}
                    </span>

                    <span className={cn("font-bold uppercase tracking-wider", isResolved ? "text-zinc-500" : colorClass)}>
                      {METRIC_LABELS[alert.metric]}
                    </span>

                    {alert.value !== null && (
                      <span className="tabular-nums text-zinc-400">
                        {alert.metric === "temp"
                          ? `${alert.value.toFixed(1)}°C`
                          : alert.metric === "memory"
                            ? `${alert.value.toFixed(1)} GB`
                            : `${alert.value.toFixed(1)}%`}
                      </span>
                    )}

                    {isResolved && (
                      <span className="text-emerald-400 text-[10px] font-medium ml-auto">
                        RESOLVED
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
