"use client";

import * as React from "react";
import { Badge, Card, Divider } from "@/components/ui/primitives";

export type InterviewQuestion = {
  id: string;
  prompt: string;
  category?: string; // e.g. Behavioral, System Design, Technical
  difficulty?: "easy" | "medium" | "hard";
  tips?: string[];
};

type QuestionCardProps = {
  question: InterviewQuestion;
  index?: number; // 1-based in UI
  rightSlot?: React.ReactNode; // e.g. "Skip" / "Next" actions
};

function diffBadge(d?: InterviewQuestion["difficulty"]) {
  if (!d) return null;
  const label = d.charAt(0).toUpperCase() + d.slice(1);
  return <Badge>{label}</Badge>;
}

export default function QuestionCard({ question, index, rightSlot }: QuestionCardProps) {
  return (
    <Card className="p-0">
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {typeof index === "number" ? <Badge>Q{index}</Badge> : null}
            {question.category ? <Badge>{question.category}</Badge> : null}
            {diffBadge(question.difficulty)}
          </div>

          <div className="text-base font-semibold leading-snug text-white">
            {question.prompt}
          </div>
        </div>

        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>

      {question.tips?.length ? (
        <>
          <Divider />
          <div className="p-4 sm:p-5">
            <div className="text-xs font-medium uppercase tracking-wide text-white/60">
              Suggested structure
            </div>
            <ul className="mt-2 space-y-1 text-sm text-white/75">
              {question.tips.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </Card>
  );
}
