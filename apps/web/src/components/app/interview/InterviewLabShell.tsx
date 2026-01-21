"use client";

import * as React from "react";
import { Card, Divider } from "@/components/ui/primitives";

type InterviewLabShellProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode; // optional right-side header actions (e.g., Start button)
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function InterviewLabShell({
  title,
  subtitle,
  right,
  children,
  footer,
}: InterviewLabShellProps) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xl font-semibold tracking-tight text-white">
            {title}
          </div>
          {subtitle ? (
            <div className="mt-1 text-sm text-white/70">{subtitle}</div>
          ) : null}
        </div>

        {right ? (
          <div className="shrink-0">{right}</div>
        ) : (
          <div className="shrink-0" />
        )}
      </div>

      {/* Body */}
      <Card className="p-0">
        <div className="p-4 sm:p-5">{children}</div>
        {footer ? (
          <>
            <Divider />
            <div className="p-3 sm:p-4">{footer}</div>
          </>
        ) : null}
      </Card>
    </div>
  );
}
