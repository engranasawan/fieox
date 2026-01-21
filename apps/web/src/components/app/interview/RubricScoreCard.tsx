"use client";

import * as React from "react";
import { Badge, Card, Divider } from "@/components/ui/primitives";

export type RubricItem = {
  key: string;              // stable id e.g. "clarity"
  label: string;            // e.g. "Clarity"
  score: number;            // 0..5 or 0..10 (we normalize visually)
  maxScore?: number;        // default 5
  notes?: string;           // short human-readable reason
};

export type RubricScore = {
  overall?: number;         // 0..100 (optional)
  items: RubricItem[];
  verdict?: "strong" | "ok" | "needs-work";
};

type RubricScoreCardProps = {
  title?: string;
  rubric?: RubricScore | null;
  isLoading?: boolean;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function overallBadge(verdict?: RubricScore["verdict"]) {
  switch (verdict) {
    case "strong":
      return <Badge>Strong</Badge>;
    case "ok":
      return <Badge>Good</Badge>;
    case "needs-work":
      return <Badge>Needs work</Badge>;
    default:
      return null;
  }
}

function normalizeTo100(score: number, max: number) {
  if (!Number.isFinite(score) || !Number.isFinite(max) || max <= 0) return 0;
  return clamp((score / max) * 100, 0, 100);
}

export default function RubricScoreCard({
  title = "Rubric Score",
  rubric,
  isLoading,
}: RubricScoreCardProps) {
  const overall = rubric?.overall;
  const items = rubric?.items ?? [];

  return (
    <Card className="p-0">
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-base font-semibold text-white">{title}</div>
            {isLoading ? <Badge>Scoring</Badge> : null}
            {!isLoading ? overallBadge(rubric?.verdict) : null}
          </div>
          <div className="mt-1 text-sm text-white/70">
            Clear, explainable grading. Built to support AI + deterministic scoring.
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-xs uppercase tracking-wide text-white/50">Overall</div>
          <div className="mt-1 font-mono text-lg text-white">
            {overall == null ? "—" : `${clamp(Number(overall), 0, 100).toFixed(0)}/100`}
          </div>
        </div>
      </div>

      <Divider />

      <div className="p-4 sm:p-5">
        {isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-14 animate-pulse rounded bg-white/10" />
                </div>
                <div className="mt-3 h-2 w-full animate-pulse rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : items.length ? (
          <div className="grid gap-3">
            {items.map((it) => {
              const max = it.maxScore ?? 5;
              const pct = normalizeTo100(it.score, max);
              return (
                <div
                  key={it.key}
                  className="rounded-lg border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-white">{it.label}</div>
                      {it.notes ? (
                        <div className="mt-1 text-sm text-white/70">{it.notes}</div>
                      ) : null}
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="font-mono text-sm text-white/80">
                        {clamp(Number(it.score), 0, max).toFixed(1)}/{max}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white/35"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/65">
            No scores yet. Once a turn is completed, we’ll generate rubric grades here.
          </div>
        )}
      </div>
    </Card>
  );
}
