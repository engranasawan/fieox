
import Link from "next/link";

import InterviewLabShell from "@/components/app/interview/InterviewLabShell";
import RubricScoreCard, { RubricScore } from "@/components/app/interview/RubricScoreCard";
import FeedbackTimeline, { FeedbackItem } from "@/components/app/interview/FeedbackTimeline";
import { Badge, Button, Card, Divider } from "@/components/ui/primitives";

function mockFinalRubric(): RubricScore {
  return {
    overall: 76,
    verdict: "ok",
    items: [
      { key: "clarity", label: "Clarity", score: 4.0, maxScore: 5, notes: "Generally easy to follow." },
      { key: "structure", label: "Structure", score: 3.6, maxScore: 5, notes: "Improve openings + endings." },
      { key: "relevance", label: "Relevance", score: 3.8, maxScore: 5, notes: "Mostly aligned to prompts." },
      { key: "confidence", label: "Confidence", score: 3.2, maxScore: 5, notes: "Reduce filler words." },
    ],
  };
}

function mockFinalTimeline(sessionId: string): FeedbackItem[] {
  const base = Date.now();
  const iso = (minsAgo: number) => new Date(base - minsAgo * 60 * 1000).toISOString();

  return [
    {
      id: "r1",
      at: iso(12),
      title: "Strong clarity",
      message: "Your explanations are easy to follow. Keep the pace and shorter sentences.",
      severity: "good",
      tags: ["clarity"],
      sessionId,
      turnIndex: 1,
    },
    {
      id: "r2",
      at: iso(10),
      title: "Add one metric per answer",
      message: "Try: latency reduced, accuracy improved, cost reduced, users served. This makes answers memorable.",
      severity: "info",
      tags: ["impact", "metrics"],
      sessionId,
      turnIndex: 2,
    },
    {
      id: "r3",
      at: iso(8),
      title: "Tighten structure: STAR",
      message: "Situation → Task → Action → Result. Keep it explicit and brief.",
      severity: "warn",
      tags: ["structure", "STAR"],
      sessionId,
      turnIndex: 3,
    },
    {
      id: "r4",
      at: iso(6),
      title: "Avoid hedging language",
      message: "Replace “I think / maybe” with concrete statements, then back them with a proof point.",
      severity: "warn",
      tags: ["confidence", "communication"],
      sessionId,
      turnIndex: 4,
    },
  ];
}

export default function InterviewReportPage({
  params,
  searchParams,
}: {
  params: { session_id: string };
  searchParams?: { role?: string; level?: string };
}) {
  const sessionId = params.session_id;
  const role = searchParams?.role ?? "Software Engineer";
  const level = (searchParams?.level ?? "mid").toUpperCase();

  const rubric = mockFinalRubric();
  const timeline = mockFinalTimeline(sessionId);

  const retryHref = `/app/interview/new`;
  const openSessionHref = `/app/interview/session/${encodeURIComponent(sessionId)}?role=${encodeURIComponent(
    role
  )}&level=${encodeURIComponent(level.toLowerCase())}`;

  return (
    <InterviewLabShell
      title="Session Report"
      subtitle={`${role} · ${level} · Report`}
      right={
        <div className="flex items-center gap-2">
          <Link href="/app/interview">
            <Button>Back to lab</Button>
          </Link>
          <Link href={openSessionHref}>
            <Button>Open session</Button>
          </Link>
        </div>
      }
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-white/70">
            This report is built to match future AI scoring outputs without redesign.
          </div>
          <div className="flex items-center gap-2">
            <Badge>Report</Badge>
            <Badge>Reusable</Badge>
          </div>
        </div>
      }
    >
      <div className="grid gap-4">
        {/* Header summary */}
        <Card className="p-0">
          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-semibold text-white">{role}</div>
                <div className="mt-1 text-sm text-white/70">
                  Level: <span className="text-white/85">{level}</span> · Session:{" "}
                  <span className="font-mono text-white/80">{sessionId}</span>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-xs uppercase tracking-wide text-white/50">Overall</div>
                <div className="mt-1 font-mono text-2xl text-white">
                  {(rubric.overall ?? 0).toFixed(0)}/100
                </div>
                <div className="mt-1">{rubric.verdict ? <Badge>{rubric.verdict}</Badge> : null}</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={retryHref}>
                <Button>Start new session</Button>
              </Link>
              <Link href={openSessionHref}>
                <Button>Review turns</Button>
              </Link>
            </div>
          </div>

          <Divider />

          <div className="p-4 sm:p-5 text-sm text-white/70">
            Next: we’ll persist turns, transcript, rubric, and timeline to Supabase and show per-turn breakdowns here.
          </div>
        </Card>

        {/* Rubric */}
        <RubricScoreCard title="Final rubric" rubric={rubric} />

        {/* Action plan */}
        <FeedbackTimeline
          title="Improvement plan"
          subtitle="Your highest-impact fixes, prioritized. Keep practicing with the same role for best progress."
          items={timeline}
        />

        {/* Small bottom CTA */}
        <Card className="p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-white/70">
              Want “next level” coaching later? We’ll add live hints, role rubrics, and institution analytics.
            </div>
            <Link href="/app/interview/new">
              <Button>Practice again</Button>
            </Link>
          </div>
        </Card>
      </div>
    </InterviewLabShell>
  );
}
