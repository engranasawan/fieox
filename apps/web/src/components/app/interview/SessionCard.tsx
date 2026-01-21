import Link from "next/link";
import * as React from "react";
import { Badge, Button, Card, Divider } from "@/components/ui/primitives";

export type InterviewSessionStatus = "draft" | "in_progress" | "completed" | "failed";
export type InterviewSessionLevel = "junior" | "mid" | "senior";

export type InterviewSessionSummary = {
  id: string;
  role: string;
  level: InterviewSessionLevel;
  status: InterviewSessionStatus;

  createdAt: string; // ISO
  turns?: number;
  overallScore?: number | null; // 0-100
};

function fmtWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function statusBadge(status: InterviewSessionStatus) {
  switch (status) {
    case "completed":
      return <Badge>Completed</Badge>;
    case "in_progress":
      return <Badge>In progress</Badge>;
    case "failed":
      return <Badge>Failed</Badge>;
    default:
      return <Badge>Draft</Badge>;
  }
}

export default function SessionCard({ session }: { session: InterviewSessionSummary }) {
  const sessionHref = `/app/interview/session/${encodeURIComponent(session.id)}?role=${encodeURIComponent(
    session.role
  )}&level=${encodeURIComponent(session.level)}`;

  const reportHref = `/app/interview/session/${encodeURIComponent(session.id)}/report?role=${encodeURIComponent(
    session.role
  )}&level=${encodeURIComponent(session.level)}`;

  const score =
    typeof session.overallScore === "number" ? Math.max(0, Math.min(100, session.overallScore)) : null;

  return (
    <Card className="p-0">
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-sm font-semibold text-white">{session.role}</div>
              {statusBadge(session.status)}
              <Badge>{session.level.toUpperCase()}</Badge>
            </div>

            <div className="mt-1 text-sm text-white/65">
              Created {fmtWhen(session.createdAt)}
              {typeof session.turns === "number" ? (
                <>
                  {" "}
                  · <span className="text-white/75">{session.turns}</span> turns
                </>
              ) : null}
              {score !== null ? (
                <>
                  {" "}
                  · <span className="text-white/75">{score}</span>/100
                </>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link href={sessionHref}>
              <Button>{session.status === "completed" ? "Review" : "Continue"}</Button>
            </Link>

            <Link href={reportHref}>
              <Button disabled={session.status !== "completed"}>Report</Button>
            </Link>
          </div>
        </div>
      </div>

      <Divider />

      <div className="p-4 sm:p-5">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-white/50">Session</div>
            <div className="mt-1 font-mono text-sm text-white/80">{session.id}</div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-white/50">Status</div>
            <div className="mt-1 text-sm font-medium text-white/85">{session.status.replace("_", " ")}</div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-white/50">Score</div>
            <div className="mt-1 text-sm font-medium text-white/85">{score === null ? "—" : `${score}/100`}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
