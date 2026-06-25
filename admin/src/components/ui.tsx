import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
const variants: Record<Variant, string> = {
  primary: "bg-violet-600 text-white hover:bg-violet-500 shadow-brand-1",
  secondary: "bg-white text-ink-800 border border-brand-200 hover:bg-brand-25",
  ghost: "bg-transparent text-brand-600 hover:bg-brand-100",
  danger: "bg-danger text-white hover:opacity-90",
  success: "bg-success text-white hover:opacity-90",
};

export const Button = ({
  variant = "primary", className, children, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) => (
  <button
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
      variants[variant], className,
    )}
    {...props}
  >
    {children}
  </button>
);

export const Card = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn("rounded-2xl border border-brand-200 bg-white shadow-brand-1", className)}>{children}</div>
);

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      "w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-50",
      className,
    )}
    {...props}
  />
);

const statusStyles: Record<string, string> = {
  pending: "bg-warn-bg text-warn",
  approved: "bg-success-bg text-success",
  rejected: "bg-danger-bg text-danger",
  unknown: "bg-brand-100 text-brand-500",
};
export const StatusBadge = ({ status }: { status?: string }) => {
  const s = status && statusStyles[status] ? status : "unknown";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", statusStyles[s])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status || "no status"}
    </span>
  );
};

export const Spinner = ({ className }: { className?: string }) => (
  <div className={cn("h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-violet-600", className)} />
);
