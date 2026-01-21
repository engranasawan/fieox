"use client";

import * as React from "react";
import { Badge, Card } from "@/components/ui/primitives";

export type InterviewRoleLevel = "junior" | "mid" | "senior";

export type InterviewRolePreset = {
  key: string;
  title: string;
  level?: InterviewRoleLevel;
  description?: string;
  tags?: string[];
};

type RolePickerProps = {
  presets: InterviewRolePreset[];
  value: InterviewRolePreset | null;
  onChange: (role: InterviewRolePreset) => void;
};

function levelBadge(level?: InterviewRoleLevel) {
  const text = (level ?? "mid").toUpperCase();
  return <Badge>{text}</Badge>;
}

export default function RolePicker({ presets, value, onChange }: RolePickerProps) {
  return (
    <div className="grid gap-3">
      {presets.map((p) => {
        const active = value?.key === p.key;

        return (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange(p)}
            className={[
              "text-left",
              "rounded-xl border",
              active ? "border-white/25 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10",
              "transition",
            ].join(" ")}
          >
            <Card className="p-0 bg-transparent border-0 shadow-none">
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm font-semibold text-white">{p.title}</div>
                      {levelBadge(p.level)}
                      {active ? <Badge>Selected</Badge> : null}
                    </div>

                    {p.description ? (
                      <div className="mt-1 text-sm text-white/65">{p.description}</div>
                    ) : (
                      <div className="mt-1 text-sm text-white/60">
                        Structured questions, recording, transcript, and rubric scoring.
                      </div>
                    )}

                    {p.tags?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {p.tags.slice(0, 6).map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/70"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-xs text-white/50">{p.key}</div>
                </div>
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
