"use client";

import * as React from "react";
import Link from "next/link";

import { apiFetch } from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";

import InterviewLabShell from "@/components/app/interview/InterviewLabShell";
import SessionCard, {
  InterviewSessionSummary,
  InterviewSessionLevel,
  InterviewSessionStatus,
} from "@/components/app/interview/SessionCard";
import { Button, Badge, Card, Divider } from "@/components/ui/primitives";

type SessionsListResponse = {
  sessions: Array<{
    id: string;
    role: string;
    level: string | null;
    status: string | null;
    created_at: string;
    current_index?: number | null;
  }>;
};

const LEVELS: readonly InterviewSessionLevel[] = ["junior", "mid", "senior"] as const;
const STATUSES: readonly InterviewSessionStatus[] = ["draft", "in_progress", "completed"] as const;

function toLevel(v: unknown): InterviewSessionLevel {
  const s = String(v ?? "").toLowerCase();
  return (LEVELS as readonly string[]).includes(s) ? (s as InterviewSessionLevel) : "mid";
}

function toStatus(v: unknown): InterviewSessionStatus {
  const s = String(v ?? "").toLowerCase();
  return (STATUSES as readonly string[]).includes(s) ? (s as InterviewSessionStatus) : "draft";
}

export default function InterviewHomePage() {
  const [sessions, setSessions] = React.useState<InterviewSessionSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error("Session expired. Please sign in again.");

        // apiFetch signature in your repo expects (path, token, init?)
        const json = await apiFetch<SessionsListResponse>("/interview/sessions?limit=20", token);

        const rows = json?.sessions ?? [];

        const mapped: InterviewSessionSummary[] = rows.map((r) => ({
          id: r.id,
          role: r.role,
          level: toLevel(r.level),
          status: toStatus(r.status),
          createdAt: r.created_at,
          turns: r.current_index ?? 0,
          overallScore: null, // later: compute from report / last turn
        }));

        if (alive) setSessions(mapped);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Failed to load sessions.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <InterviewLabShell
      title="Interview Lab"
      subtitle="Practice role-specific interviews with recording, transcription, and rubric scoring."
      right={
        <Link href="/app/interview/new">
          <Button>New session</Button>
        </Link>
      }
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-white/70">
            Tip: Start with 5–7 questions. Keep answers 60–120 seconds for best feedback.
          </div>
          <div className="flex items-center gap-2">
            <Badge>Job Seeker</Badge>
            <Badge>Final-grade UI</Badge>
          </div>
        </div>
      }
    >
      <div className="grid gap-4">
        {/* Quick actions */}
        <Card className="p-0">
          <div className="p-4 sm:p-5">
            <div className="text-base font-semibold text-white">Quick start</div>
            <div className="mt-1 text-sm text-white/70">
              Pick a role, record answers, and get structured feedback. No rework later — this UI is built to scale
              into AI + analytics.
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/app/interview/new">
                <Button>Start new session</Button>
              </Link>
              <Link href="/app">
                <Button>Back to dashboard</Button>
              </Link>
            </div>
          </div>

          <Divider />

          <div className="p-4 sm:p-5">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-xs uppercase tracking-wide text-white/50">Mode</div>
                <div className="mt-1 text-sm font-medium text-white">Mock interview</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-xs uppercase tracking-wide text-white/50">Audio</div>
                <div className="mt-1 text-sm font-medium text-white">Record + replay</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-xs uppercase tracking-wide text-white/50">Evaluation</div>
                <div className="mt-1 text-sm font-medium text-white">Rubric scoring</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent sessions */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-white/80">Recent sessions</div>
          <Link href="/app/interview/new" className="text-sm text-white/70 hover:text-white hover:underline">
            Start another →
          </Link>
        </div>

        {loading ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/65">
            Loading sessions...
          </div>
        ) : err ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{err}</div>
        ) : sessions.length ? (
          <div className="grid gap-3">
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/65">
            No sessions yet. Create your first interview session.
          </div>
        )}
      </div>
    </InterviewLabShell>
  );
}
