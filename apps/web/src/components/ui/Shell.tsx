import React from "react";

type ShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;

  /** Optional slots */
  topNav?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;

  /** Layout tuning */
  size?: "md" | "lg" | "xl";
  padded?: boolean;
  className?: string;
};

const SIZE_MAP: Record<NonNullable<ShellProps["size"]>, string> = {
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
};

export function Shell({
  children,
  title,
  subtitle,
  topNav,
  actions,
  footer,
  size = "lg",
  padded = true,
  className,
}: ShellProps) {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* soft blobs */}
        <div className="absolute -top-48 -left-48 h-[620px] w-[620px] rounded-full bg-gradient-to-br from-indigo-500/25 via-cyan-400/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-48 -right-48 h-[620px] w-[620px] rounded-full bg-gradient-to-br from-fuchsia-500/20 via-purple-400/10 to-transparent blur-3xl" />

        {/* subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-black/20" />

        {/* optional noise class if you have it */}
        <div className="absolute inset-0 bg-noise opacity-25" />
      </div>

      {/* Content */}
      <div
        className={[
          "relative z-10 mx-auto",
          SIZE_MAP[size],
          padded ? "px-6 py-10" : "",
          className ?? "",
        ].join(" ")}
      >
        {/* Top Nav slot */}
        {topNav ? <div className="mb-6">{topNav}</div> : null}

        {/* Header */}
        {(title || subtitle || actions) && (
          <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              {title ? (
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  {title}
                </h1>
              ) : null}

              {subtitle ? (
                <p className="mt-2 text-white/70 max-w-2xl">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {actions ? <div className="shrink-0">{actions}</div> : null}
          </header>
        )}

        {/* Main glass frame (optional but looks premium) */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className={padded ? "p-6 md:p-8" : ""}>{children}</div>
        </div>

        {/* Footer slot */}
        {footer ? <div className="mt-8">{footer}</div> : null}
      </div>
    </main>
  );
}
