"use client";

import * as React from "react";
import Link from "next/link";
import { Badge, Card, Divider } from "@/components/ui/primitives";

export type FeedbackSeverity = "info" | "good" | "warn" | "risk";

export type FeedbackItem = {
  id: string;
  at?: string; // ISO datetime, optional
  title: string;
  message?: string;
  severity?: FeedbackSeverity;
  tags?: string[];
  sessionId?: string;
  turnIndex?: number; // 1-based
};

type FeedbackTimelineProps = {
  title?: string;
  subtitle?: string;
  items?: FeedbackItem[] | null;
  isLoading?: boolean;
};

function fmtAt(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sevBadge(sev?: FeedbackSeverity) {
  // We keep styling minimal (your primitives likely define Badge styling)
  switch (sev) {
    case "good":
      return <Badge>Good</Badge>;
    case "warn":
      return <Badge>Improve</Badge>;
    case "risk":
      return <Badge>Risk</Badge>;
    case "info":
    default:
      return <Badge>Note</Badge>;
  }
}

export default function FeedbackTimeline({
  title = "Coach Feedback",
  subtitle = "Actionable cues across your session (clarity, structure, confidence).",
  items,
  isLoading,
}: FeedbackTimelineProps) {
  const list = items ?? [];
  const sorted = React.useMemo(() => {
    // stable sort by time if present, else keep order
    return [...list].sort((a, b) => {
      const ta = a.at ? new Date(a.at).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.at ? new Date(b.at).getTime() : Number.POSITIVE_INFINITY;
      if (ta === tb) return 0;
      return ta - tb;
    });
  }, [list]);

  return (
    <Card className="p-0">
      <div className="p-4 sm:p-5">
        <div className="text-base font-semibold text-white">{title}</div>
        <div className="mt-1 text-sm text-white/70">{subtitle}</div>
      </div>

      <Divider />

      <div className="p-4 sm:p-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-white/10 bg-white/5 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="h-3 w-40 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
                </div>
                <div className="mt-3 h-3 w-full animate-pulse rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : sorted.length ? (
          <div className="space-y-3">
            {sorted.map((it, idx) => {
              const hasJump = it.sessionId && typeof it.turnIndex === "number";
              const jumpHref = hasJump
                ? `/app/interview/session/${encodeURIComponent(it.sessionId!)}` +
                  `?turn=${encodeURIComponent(String(it.turnIndex))}`
                : null;

              return (
                <div key={it.id} className="relative">
                  {/* left rail */}
                  <div className="absolute left-2 top-0 h-full w-px bg-white/10" />
                  <div className="flex gap-3">
                    <div className="mt-1 h-4 w-4 shrink-0 rounded-full border border-white/20 bg-white/10" />
                    <div className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-white">{it.title}</div>
                            {sevBadge(it.severity)}
                          </div>

                          <div className="mt-1 text-xs text-white/50">
                            {fmtAt(it.at)}
                            {typeof it.turnIndex === "number" ? (
                              <>
                                {" "}
                                · Turn{" "}
                                <span className="text-white/70">{it.turnIndex}</span>
                              </>
                            ) : null}
                          </div>
                        </div>

                        {jumpHref ? (
                          <Link
                            href={jumpHref}
                            className="text-xs text-white/70 hover:text-white hover:underline"
                          >
                            Jump to turn
                          </Link>
                        ) : null}
                      </div>

                      {it.message ? (
                        <div className="mt-2 text-sm leading-relaxed text-white/75">
                          {it.message}
                        </div>
                      ) : null}

                      {it.tags?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {it.tags.slice(0, 10).map((t, i) => (
                            <Badge key={`${it.id}-tag-${i}`}>{t}</Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* spacing between items */}
                  {idx === sorted.length - 1 ? null : <div className="h-2" />}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/65">
            No feedback yet. Once you complete a few answers, we’ll start surfacing coach notes here.
          </div>
        )}
      </div>
    </Card>
  );
}
