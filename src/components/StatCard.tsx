import { type FC } from "react";
import { cn } from "../utils/utils";

interface StartCardProps {
  icon: React.ReactElement;
  label: string;
  value: string;
  color: "emerald" | "amber" | "blue" | "purple" | "red" | "indigo";
  trend?: "up" | "down" | "stable";
}

export const StatCard: FC<StartCardProps> = ({
  icon,
  label,
  value,
  color,
  trend,
}) => {
  const colors = {
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    amber: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    purple: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    red: "text-red-400 bg-red-400/10 border-red-400/20 shadow-[0_0_30px_-10px_rgba(248,113,113,0.3)]",
    indigo: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  };

  return (
    <div
      className={cn(
        "bg-zinc-900/40 border p-4 rounded-3xl backdrop-blur-md transition-all group hover:bg-zinc-800/40",
        colors[color],
        "flex items-start gap-2"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="p-2.5 rounded-xl bg-white/5">{icon}</div>
        {trend === "up" && (
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
          {label}
        </p>
        <div className="text-2xl font-bold tracking-tighter text-white">
          {value}
        </div>
      </div>
    </div>
  );
};
