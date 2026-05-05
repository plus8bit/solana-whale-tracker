import { cn } from "@/lib/utils";

export function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[11px]",
        variant === "outline"
          ? "border-emerald-200/15 bg-white/[0.03] text-emerald-50/70"
          : "border-emerald-300/25 bg-emerald-300/12 text-emerald-200",
        className
      )}
      {...props}
    />
  );
}
