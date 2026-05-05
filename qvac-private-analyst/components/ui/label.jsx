import { cn } from "@/lib/utils";

export function Label({ className, ...props }) {
  return <label className={cn("font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-100/50", className)} {...props} />;
}
