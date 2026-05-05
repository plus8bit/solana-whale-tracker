import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return <div className={cn("glass rounded-xl", className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("border-b border-emerald-200/10 p-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn("font-mono text-xs uppercase tracking-[0.2em] text-emerald-100", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-4", className)} {...props} />;
}
