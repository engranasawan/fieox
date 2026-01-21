"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

import InterviewLabShell from "@/components/app/interview/InterviewLabShell";
import QuestionCard, { InterviewQuestion } from "@/components/app/interview/QuestionCard";
import RecorderPanel, { RecordedAudio } from "@/components/app/interview/RecorderPanel";
import TranscriptPanel from "@/components/app/interview/TranscriptPanel";
import RubricScoreCard, { RubricScore } from "@/components/app/interview/RubricScoreCard";
import FeedbackTimeline, { FeedbackItem } from "@/components/app/interview/FeedbackTimeline";

import { Badge, Button, Card, Divider } from "@/components/ui/primitives";

function mockQuestions(role?: string): InterviewQuestion[] {
  const r = role ?? "your role";
  return [
    {
      id: "q1",
      category: "Behavioral",
      difficulty: "easy",
      prompt: `Tell me about yourself and why you're a fit for ${r}.`,
      tips: ["Keep it 60–90s", "Present: who you are → impact → why this role", "End with what you want next"],
    },
    {
      id: "q2",
      category: "Behavioral",
      difficulty: "medium",
      prompt: "Describe a challenging project and how you handled trade-offs.",
      tips: ["Context → constraints", "Decision criteria", "Outcome + what you’d do differently"],
    },
    {
      id: "q3",
      category: "Technical",
      difficulty: "medium",
      prompt: "Explain a concept you know well as if teaching a junior teammate.",
      tips: ["Define simply", "Give a concrete example", "Mention common pitfalls"],
    },
  ];
}

function mockRubric(transcript?: string): RubricScore {
  const has = !!(transcript && transcript.trim().length > 30);

  const clarity = has ? 3.9 : 0;
  const structure = has ? 3.6 : 0;
  const relevance = has ? 3.7 : 0;
  const confidence = has ? 3.3 : 0;

  const overall = has ? Math.round(((clarity + structure + relevance + confidence) / 20) * 100) : 0;

  return {
    overall,
    verdict: overall >= 80 ? "strong" : overall >= 60 ? "ok" : "needs-work",
    items: [
      { key: "clarity", label: "Clarity", score: clarity, maxScore: 5, notes: "Clear sentences, minimal rambling." },
      { key: "structure", label: "Structure", score: structure, maxScore: 5, notes: "Some structure present; tighten transitions." },
      { key: "relevance", label: "Relevance", score: relevance, maxScore: 5, notes: "Mostly aligned to question; add one concrete example." },
      { key: "confidence", label: "Confidence", score: confidence, maxScore: 5, notes: "Steady tone; reduce filler words over time." },
    ],
  };
}

function mockFeedback(sessionId: string, turnIndex: number, rubric: RubricScore): FeedbackItem[] {
  const now = new Date().toISOString();
  const overall = rubric.overall ?? 0;

  const base: FeedbackItem[] = [
    {
      id: `f_${turnIndex}_1`,
      at: now,
      title: "Use a stronger opening",
      message: "Start with a crisp one-liner: role + years + domain impact. Then add 1 proof point.",
      severity: "warn",
      tags: ["opening", "structure"],
      sessionId,
      turnIndex,
    },
    {
      id: `f_${turnIndex}_2`,
      at: now,
      title: "Add one metric",
      message: "Attach one measurable result (speed, cost, accuracy, revenue, scale) to make the answer memorable.",
      severity: "info",
      tags: ["impact", "metrics"],
      sessionId,
      turnIndex,
    },
  ];

  if (overall >= 75) {
    base.unshift({
      id: `f_${turnIndex}_0`,
      at: now,
      title: "Strong clarity",
      message: "Your explanation is easy to follow. Keep the pace and short sentences.",
      severity: "good",
      tags: ["clarity"],
      sessionId,
      turnIndex,
    });
  }

  return base;
}

export default function InterviewSessionPage() {
  // ✅ Next.js 16 client-safe: do not use `params` prop here
  const params = useParams<{ session_id: string }>();
  const sessionId = params?.session_id ?? "";

  const search = useSearchParams();
  const role = search.get("role") ?? "Software Engineer";
  const level = (search.get("level") ?? "mid") as "junior" | "mid" | "senior";

  const questions = React.useMemo(() => mockQuestions(role), [role]);
  const [idx, setIdx] = React.useState(0);

  const [audio, setAudio] = React.useState<RecordedAudio | null>(null);
  const [transcript, setTranscript] = React.useState<string | null>(null);

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [timeline, setTimeline] = React.useState<FeedbackItem[]>([]);
  const [rubric, setRubric] = React.useState<RubricScore | null>(null);

  const current = questions[idx];

  const submitTurn = async () => {
    setIsProcessing(true);
    try {
      const fake = audio
        ? `Answer transcript (mock). Role: ${role}. Level: ${level}. Recorded ${(audio.durationMs / 1000).toFixed(1)}s.`
        : `Answer transcript (mock). Role: ${role}. Level: ${level}.`;

      await new Promise((r) => setTimeout(r, 450));

      setTranscript(fake);

      const r = mockRubric(fake);
      setRubric(r);

      const turnIndex = idx + 1;
      setTimeline((prev) => [...mockFeedback(sessionId, turnIndex, r), ...prev]);
    } finally {
      setIsProcessing(false);
    }
  };

  const nextQuestion = () => {
    setAudio(null);
    setTranscript(null);
    setRubric(null);
    setIdx((i) => Math.min(i + 1, questions.length - 1));
  };

  const prevQuestion = () => {
    setAudio(null);
    setTranscript(null);
    setRubric(null);
    setIdx((i) => Math.max(i - 1, 0));
  };

  const doneHref = `/app/interview/session/${encodeURIComponent(sessionId)}/report?role=${encodeURIComponent(
    role
  )}&level=${encodeURIComponent(level)}`;

  return (
    <InterviewLabShell
      title="Session"
      subtitle={`${role} · ${level.toUpperCase()} · Session ${sessionId ? sessionId.slice(-6) : ""}`}
      right={
        <div className="flex items-center gap-2">
          <Link href="/app/interview">
            <Button>Exit</Button>
          </Link>
          <Link href={doneHref}>
            <Button>Report</Button>
          </Link>
        </div>
      }
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-white/70">
            Turn {idx + 1} of {questions.length} · Record → Submit → Review.
          </div>
          <div className="flex items-center gap-2">
            <Badge>Deterministic</Badge>
            <Badge>Upgradeable</Badge>
          </div>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        {/* LEFT */}
        <div className="grid gap-4">
          <QuestionCard
            question={current}
            index={idx + 1}
            rightSlot={<Badge>{current?.category ?? "Question"}</Badge>}
          />

          <RecorderPanel
            title="Record your answer"
            subtitle="Short, structured answers perform best. Aim for 60–120 seconds."
            disabled={isProcessing}
            onRecorded={(a) => setAudio(a)}
            onCleared={() => setAudio(null)}
          />

          <Card className="p-0">
            <div className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium text-white/80">Turn actions</div>
                <div className="text-xs text-white/50">
                  {audio ? `Audio captured · ${(audio.durationMs / 1000).toFixed(1)}s` : "No audio yet"}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={submitTurn} disabled={isProcessing}>
                  {isProcessing ? "Processing..." : "Submit answer"}
                </Button>

                <Button onClick={prevQuestion} disabled={isProcessing || idx === 0}>
                  Previous
                </Button>

                <Button onClick={nextQuestion} disabled={isProcessing || idx >= questions.length - 1}>
                  Next
                </Button>

                <Link href={doneHref}>
                  <Button disabled={isProcessing}>Finish & view report</Button>
                </Link>
              </div>
            </div>

            <Divider />

            <div className="p-4 sm:p-5 text-sm text-white/70">
              Later we’ll add: real transcription (Whisper), live coaching, and a rubric engine per role.
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="grid gap-4">
          <TranscriptPanel
            transcript={transcript}
            isLoading={isProcessing}
            keywords={transcript ? ["structure", "impact", "clarity", "metrics"] : undefined}
          />

          <RubricScoreCard rubric={rubric} isLoading={isProcessing} />

          <FeedbackTimeline items={timeline} isLoading={false} subtitle="Coach notes across turns." />
        </div>
      </div>
    </InterviewLabShell>
  );
}
