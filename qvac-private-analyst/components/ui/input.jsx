import { cn } from "@/lib/utils";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-emerald-200/15 bg-black/35 px-3 font-mono text-sm text-emerald-50 outline-none transition focus:border-emerald-300/60 focus:ring-4 focus:ring-emerald-300/10",
        className
      )}
      {...props}
    />
  );
}
