import { useState } from "react";
import { Toaster } from "sonner";
import { cn } from "./utils/utils";
import {
  Cpu,
  Thermometer,
  Database,
  Network,
  Zap,
  Settings,
  Server,
  RefreshCw,
  Cloud,
} from "lucide-react";
import { ControlPanel, type ControlCommand } from "./components/ControlPanel";
import { FleetPanel } from "./components/FleetPanel";
import { MetricChart } from "./components/MetricChart";
import { AlertConsole } from "./components/AlertConsole";
import { useServers, type ServerData } from "./hooks/useDeviceHealth";
import { useAlertToasts } from "./hooks/useAlertToasts";

function App() {
  const {
    servers,
    isConnected: connected,
    sendCommand,
    reconnect,
    getServerHistory,
    thresholds,
    alerts,
    clearAlerts,
  } = useServers();
  useAlertToasts(alerts);
  const [selectedServer, setSelectedServer] = useState<ServerData | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isFleetOpen, setIsFleetOpen] = useState(false);

  const handleOpenControl = (server: ServerData) => {
    setSelectedServer(server);
    setIsPanelOpen(true);
  };

  const handleCloseControl = () => {
    setIsPanelOpen(false);
  };

  const handleSendCommand = (command: ControlCommand) => {
    sendCommand(command);
  };

  const getSelectedServerData = (): ServerData | null => {
    if (!selectedServer) return null;
    return (
      servers.find((s) => s.server_id === selectedServer.server_id) ??
      selectedServer
    );
  };

  return (
    <div className="min-h-screen bg-[#060606] text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between bg-black/60 backdrop-blur-2xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Cloud className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300">
              Cloudmetric
            </h1>
            <span className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 font-medium -mt-0.5">
              Real-time Fleet Monitor
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsFleetOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 transition-all text-zinc-400 hover:text-emerald-400"
          >
            <Server className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Administrar
            </span>
          </button>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-500",
              connected
                ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]"
                : "bg-red-500/5 text-red-400 border-red-500/20",
            )}
          >
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full animate-pulse",
                connected ? "bg-emerald-400" : "bg-red-400",
              )}
            />
            {connected ? "Gateway Online" : "Gateway Offline"}
          </div>
          {!connected && (
            <button
              onClick={reconnect}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 transition-all text-red-400 hover:text-red-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Reconnect
              </span>
            </button>
          )}
        </div>
      </header>
      <main className="p-6 mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {servers &&
            servers.map((server) => (
              <div
                key={server.server_id}
                className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden group flex flex-col"
              >
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                  <Zap className="w-20 h-20 text-emerald-500" />
                </div>

                {/* Header */}
                <div className="flex items-start justify-between mb-5 relative z-10">
                  <div>
                    <h3 className="font-bold text-lg tracking-tight">
                      {server.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                          server.status === "Healthy" &&
                            "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                          server.status === "Warning" &&
                            "bg-amber-500/10 text-amber-400 border-amber-500/20",
                          server.status === "Critical" &&
                            "bg-red-500/10 text-red-400 border-red-500/20",
                          server.status === "Offline" &&
                            "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
                        )}
                      >
                        {server.status}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Uptime {Math.floor(server.uptime / 60)}m
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenControl(server)}
                    className="flex items-center gap-1.5 px-3 py-2 cursor-pointer rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 transition-all text-zinc-400 hover:text-emerald-400"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Control
                    </span>
                  </button>
                </div>

                {/* Metrics Chips */}
                <div className="flex flex-wrap gap-2 mb-5 relative z-10">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors",
                      server.cpu > 80
                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                        : server.cpu > 70
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : "bg-white/5 border-white/5 text-emerald-400",
                    )}
                  >
                    <Cpu className="w-3 h-3" />
                    <span className="text-xs font-bold tabular-nums">
                      {server.cpu?.toFixed(1) ?? "--"}%
                    </span>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors",
                      server.temp > 65
                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                        : server.temp > 60
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : "bg-white/5 border-white/5 text-blue-400",
                    )}
                  >
                    <Thermometer className="w-3 h-3" />
                    <span className="text-xs font-bold tabular-nums">
                      {server.temp?.toFixed(1) ?? "--"}°C
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-indigo-400">
                    <Database className="w-3 h-3" />
                    <span className="text-xs font-bold tabular-nums">
                      {server.memory?.toFixed(1) ?? "--"} GB
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-purple-400">
                    <Network className="w-3 h-3" />
                    <span className="text-xs font-bold tabular-nums">
                      {server.network_in?.toFixed(0) ?? "--"} Mbps
                    </span>
                  </div>
                </div>

                {/* Separator */}
                <div className="border-t border-white/5 mb-4" />

                {/* Chart */}
                <div className="flex-1 min-h-0">
                  <MetricChart
                    history={getServerHistory(server.server_id)}
                    thresholds={thresholds}
                  />
                </div>
              </div>
            ))}
        </div>
      </main>

      <ControlPanel
        server={getSelectedServerData()}
        isOpen={isPanelOpen}
        onClose={handleCloseControl}
        onSendCommand={handleSendCommand}
      />

      <FleetPanel
        isOpen={isFleetOpen}
        onClose={() => setIsFleetOpen(false)}
        servers={servers}
      />

      <AlertConsole alerts={alerts} onClear={clearAlerts} />

      <Toaster
        position="top-right"
        theme="dark"
        closeButton
        toastOptions={{
          style: {
            background: "#18181b",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
        }}
      />
    </div>
  );
}

export default App;
