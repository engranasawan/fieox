"use client";

import React from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-400/40 disabled:opacity-50 disabled:cursor-not-allowed";

  const styles =
    variant === "primary"
      ? "bg-gradient-to-b from-white/15 to-white/5 border border-white/15 hover:from-white/20 hover:to-white/10"
      : variant === "secondary"
      ? "bg-white/5 border border-white/10 hover:bg-white/10"
      : "hover:bg-white/5";

  return (
    <button className={cn(base, styles, className)} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition",
        "focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20",
        className
      )}
      {...props}
    />
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-white/10", className)} />;
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">
      {children}
    </span>
  );
}
