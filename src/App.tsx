import { cn } from "./utils/utils";
import { Cpu, Thermometer, Database, Network, Server, Zap } from "lucide-react";
import { StatCard } from "./components/StatCard";
import { useDeviceHealth } from "./hooks/useDeviceHealth";
import { HealthStatus } from "./types/deviceHealth";

function App() {
  const { latest, isConnected: connected } = useDeviceHealth();

  return (
    <div className="min-h-screen bg-[#060606] text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between bg-black/60 backdrop-blur-2xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-lg transition-colors",
              "bg-emerald-500/10",
            )}
          ></div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold">
              Server Monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
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
        </div>
      </header>
      <main className="p-6 mx-auto">
        <div className="space-y-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {latest &&
            Array.from(latest).map(([serverId, health]) => (
              <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Zap className="w-24 h-24 text-emerald-500" />
                </div>

                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="font-bold text-xl tracking-tight">
                      {serverId}
                    </h3>
                    <Server
                      className={cn(
                        "w-5 h-5",
                        health.status !== HealthStatus.HEALTHY
                          ? "text-red-400"
                          : "text-emerald-400",
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 min-[32rem]:grid-cols-2 gap-4">
                  <StatCard
                    icon={<Cpu />}
                    label="CPU Load"
                    value={`${health.cpu ?? "--"}%`}
                    color={health.cpu && health.cpu > 80 ? "red" : "emerald"}
                    trend={
                      health.cpu ? (health.cpu > 70 ? "up" : "stable") : "stable"
                    }
                  />
                  <StatCard
                    icon={<Thermometer />}
                    label="Nucleus Temp"
                    value={`${health.temp ?? "--"}°C`}
                    color={health.temp && health.temp > 65 ? "amber" : "blue"}
                    trend={
                      health.temp ? (health.temp > 60 ? "up" : "stable") : "stable"
                    }
                  />
                  <StatCard
                    icon={<Database />}
                    label="Memory Buffer"
                    value={`${health.memory ?? "--"} GB`}
                    color="indigo"
                  />
                  <StatCard
                    icon={<Network />}
                    label="Network I/O"
                    value={`${health.network.in_value ?? "--"} Mbps`}
                    color="purple"
                  />
                </div>
              </div>
            ))}
        </div>
      </main>
    </div>
  );
}

export default App;
