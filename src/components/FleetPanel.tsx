import { type FC, useState } from "react";
import { cn } from "../utils/utils";
import { X, Plus, Trash2, Server } from "lucide-react";
import type { ServerData } from "../hooks/useDeviceHealth";
import { createServer, deleteServer } from "../services/api";

interface FleetPanelProps {
  isOpen: boolean;
  onClose: () => void;
  servers: ServerData[];
}

export const FleetPanel: FC<FleetPanelProps> = ({
  isOpen,
  onClose,
  servers,
}) => {
  const [newServerName, setNewServerName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async () => {
    if (!newServerName.trim()) return;

    setIsCreating(true);
    try {
      await createServer(newServerName.trim());
      setNewServerName("");
    } catch (error) {
      console.error("Failed to create server:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (serverId: string) => {
    if (deleteConfirmId !== serverId) {
      setDeleteConfirmId(serverId);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteServer(serverId);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Failed to delete server:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
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
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-lg font-bold text-white">
                Administración de Servers
              </h2>
              <p className="text-xs text-zinc-500">
                {servers.length} server{servers.length !== 1 ? "s" : ""} active
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Agregar server
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Server name..."
                disabled={isCreating}
                className={cn(
                  "flex-1 bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm",
                  "focus:outline-none focus:border-emerald-500/50",
                  "placeholder:text-zinc-600",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                )}
              />
              <button
                onClick={handleCreate}
                disabled={!newServerName.trim() || isCreating}
                className={cn(
                  "px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30",
                  "text-emerald-400 font-bold text-sm uppercase tracking-wider transition-all",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "flex items-center gap-2",
                )}
              >
                <Plus className="w-4 h-4" />
                {isCreating ? "Adding..." : "Add"}
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Servers
            </h3>
            <div className="space-y-2">
              {servers.length === 0 ? (
                <div className="text-center py-12 text-zinc-600">
                  <Server className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No servers in fleet</p>
                </div>
              ) : (
                servers.map((server) => (
                  <div
                    key={server.server_id}
                    className="bg-zinc-800/50 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-zinc-500">
                            #{server.server_id}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                              server.status === "healthy" &&
                                "bg-emerald-500/10 text-emerald-400",
                              server.status === "warning" &&
                                "bg-amber-500/10 text-amber-400",
                              server.status === "critical" &&
                                "bg-red-500/10 text-red-400",
                              server.status === "offline" &&
                                "bg-zinc-500/10 text-zinc-400",
                            )}
                          >
                            {server.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white truncate">
                          {server.name}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(server.server_id)}
                        onBlur={handleCancelDelete}
                        disabled={isDeleting}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          deleteConfirmId === server.server_id
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-red-400 border border-transparent",
                          "disabled:opacity-40 disabled:cursor-not-allowed",
                        )}
                        title={
                          deleteConfirmId === server.server_id
                            ? "Click again to confirm"
                            : "Delete server"
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-white/10 bg-zinc-900/80 backdrop-blur">
          <p className="text-[10px] text-zinc-500 text-center uppercase tracking-wider">
            Cambios sincronizados en tiempo real con simuladores
          </p>
        </div>
      </div>
    </>
  );
};
