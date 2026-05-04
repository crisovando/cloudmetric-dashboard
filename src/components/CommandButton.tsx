import { type FC } from "react";
import { cn } from "../utils/utils";

interface CommandButton {
  onClick: () => void;
  icon: React.ReactElement;
  label: string;
  subText?: string;
  variant?: "danger" | "success";
  sub: string;
}

export const CommandButton: FC<CommandButton> = ({
  onClick,
  icon,
  label,
  sub,
  variant,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 group",
        variant === "danger"
          ? "border-red-500/10 bg-red-500/5 hover:bg-red-500/10 text-red-100"
          : variant === "success"
            ? "border-emerald-500/10 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-100"
            : "border-white/5 bg-white/5 hover:bg-white/10 text-zinc-100",
      )}
    >
      <div
        className={cn(
          "p-2 rounded-xl bg-white/5 transition-transform group-active:scale-90",
          variant === "danger"
            ? "text-red-400"
            : variant === "success"
              ? "text-emerald-400"
              : "text-zinc-400",
        )}
      >
        {icon}
      </div>
      <div>
        <p className="font-bold text-xs">{label}</p>
        <p className="text-[10px] opacity-40 font-medium uppercase tracking-wider">
          {sub}
        </p>
      </div>
    </button>
  );
};
