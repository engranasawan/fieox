"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Shell } from "@/components/ui/Shell";
import TopNav from "@/components/app/TopNav";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { Badge, Card, Divider } from "@/components/ui/primitives";
import { supabase } from "@/lib/supabaseClient";

type JobStatus = "draft" | "open" | "closed";
type WorkMode = "onsite" | "remote" | "hybrid";

type Job = {
  id: string;
  title: string;
  company?: string | null;
  location?: string | null;
  work_mode?: WorkMode | null;
  status?: JobStatus | null;
  skills?: string[];
  description?: string | null;
  created_at?: string;
};

type AppStage = "new" | "screening" | "interview" | "offer" | "hired" | "rejected";

type Application = {
  id: string;
  job_id: string;
  candidate_user_id: string;
  stage: AppStage;
  notes?: string | null;
  resume_id?: string | null;
  match_score?: number | null;
  match_breakdown?: any;
  created_at?: string;
};

type MeResponse = {
  ok: boolean;
  profile?: {
    recruiter_enabled?: boolean | null;
    recruiter_tenant_id?: string | null;
  } | null;
};

const STAGES: { key: AppStage; label: string; help: string }[] = [
  { key: "new", label: "New", help: "Fresh applicants to triage." },
  { key: "screening", label: "Screening", help: "Quick review / shortlist." },
  { key: "interview", label: "Interview", help: "Actively interviewing." },
  { key: "offer", label: "Offer", help: "Offer in progress." },
  { key: "hired", label: "Hired", help: "Closed-won." },
  { key: "rejected", label: "Rejected", help: "Closed-lost." },
];

export default function RecruiterJobDetailPage() {
  const { ready } = useAuthGuard();
  const router = useRouter();
  const params = useParams<{ job_id: string }>();
  const jobId = params?.job_id;

  const baseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000",
    []
  );

  const [gateLoading, setGateLoading] = useState(true);
  const [recruiterEnabled, setRecruiterEnabled] = useState(false);
  const [enabling, setEnabling] = useState(false);

  const [job, setJob] = useState<Job | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = async (): Promise<string> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Session expired. Please sign in again.");
    return token;
  };

  const refreshGate = async () => {
    setGateLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const meRes = await fetch(`${baseUrl}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meJson = (await meRes.json()) as MeResponse;

      const enabled = Boolean(meJson?.profile?.recruiter_enabled && meJson?.profile?.recruiter_tenant_id);
      setRecruiterEnabled(enabled);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load your account status.");
      setRecruiterEnabled(false);
    } finally {
      setGateLoading(false);
    }
  };

  const enableRecruiter = async () => {
    setEnabling(true);
    setError(null);

    try {
      const token = await getToken();
      const res = await fetch(`${baseUrl}/onboarding/enable_recruiter`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail ?? "Failed to enable recruiter workspace.");

      await refreshGate();
    } catch (e: any) {
      setError(e?.message ?? "Failed to enable recruiter workspace.");
    } finally {
      setEnabling(false);
    }
  };

  const refreshData = async () => {
    if (!jobId) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();

      // Load job
      const jobRes = await fetch(`${baseUrl}/recruiter/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const jobJson = await jobRes.json();
      if (!jobRes.ok) throw new Error(jobJson?.detail ?? "Failed to load job.");
      setJob(jobJson?.job ?? null);

      // Load candidates/apps
      const appsRes = await fetch(`${baseUrl}/recruiter/jobs/${jobId}/candidates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const appsJson = await appsRes.json();
      if (!appsRes.ok) throw new Error(appsJson?.detail ?? "Failed to load candidates.");
      setApps(appsJson?.applications ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load job.");
      setJob(null);
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    refreshGate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, baseUrl]);

  useEffect(() => {
    if (!ready) return;
    if (gateLoading) return;
    if (!recruiterEnabled) return;
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, gateLoading, recruiterEnabled, jobId]);

  if (!ready) return null;

  // Gate UI
  if (!gateLoading && !recruiterEnabled) {
    return (
      <Shell
        title="Job"
        subtitle="Enable recruiter workspace to access jobs and candidates."
        topNav={<TopNav />}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <Badge>Recruiter</Badge>
            <span className="text-xs text-white/50">Setup</span>
          </div>

          <h2 className="mt-5 text-xl font-semibold tracking-tight">Recruiter workspace required</h2>
          <p className="mt-2 text-white/70">
            This job lives in the recruiter tenant. Enable recruiter workspace to view and manage it.
          </p>

          <Divider className="my-6" />

          {error ? (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <div className="text-xs text-white/50">One-time setup.</div>
            <button
              type="button"
              disabled={enabling}
              onClick={enableRecruiter}
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 disabled:opacity-60"
            >
              {enabling ? "Enabling…" : "Enable recruiter workspace"}
            </button>
          </div>
        </Card>
      </Shell>
    );
  }

  const grouped: Record<AppStage, Application[]> = {
    new: [],
    screening: [],
    interview: [],
    offer: [],
    hired: [],
    rejected: [],
  };

  for (const a of apps) {
    const k = (a.stage ?? "new") as AppStage;
    if (!grouped[k]) grouped.new.push(a);
    else grouped[k].push(a);
  }

  const totalCandidates = apps.length;

  const setJobStatus = async (next: JobStatus) => {
    if (!job) return;
    setBusy(true);
    setError(null);

    try {
      const token = await getToken();
      const res = await fetch(`${baseUrl}/recruiter/jobs/${job.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail ?? "Failed to update job status.");

      setJob(json?.job ?? job);
    } catch (e: any) {
      setError(e?.message ?? "Failed to update job.");
    } finally {
      setBusy(false);
    }
  };

  const moveCandidate = async (applicationId: string, nextStage: AppStage) => {
    setBusy(true);
    setError(null);

    try {
      const token = await getToken();
      const res = await fetch(`${baseUrl}/recruiter/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stage: nextStage }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail ?? "Failed to update application.");

      const updated = json?.application as Application | undefined;
      if (!updated) throw new Error("Update succeeded but no application returned.");

      setApps((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (e: any) {
      setError(e?.message ?? "Failed to update candidate.");
    } finally {
      setBusy(false);
    }
  };

  const statusBadge = (s?: JobStatus | null) => {
    const text = s ?? "draft";
    const base =
      "inline-flex items-center rounded-lg border px-2 py-1 text-xs font-semibold";
    if (text === "open") return <span className={`${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-200`}>open</span>;
    if (text === "closed") return <span className={`${base} border-white/10 bg-white/5 text-white/70`}>closed</span>;
    return <span className={`${base} border-amber-500/20 bg-amber-500/10 text-amber-200`}>draft</span>;
  };

  return (
    <Shell
      title={job?.title ?? "Job"}
      subtitle="Review candidates, move stages, and keep decisions consistent."
      topNav={<TopNav />}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Job surface */}
        <Card className="p-6 lg:col-span-1">
          <div className="flex items-center justify-between">
            <Badge>Role</Badge>
            <span className="text-xs text-white/50">
              <Link href="/recruiter/jobs" className="hover:text-white/80">
                Back to jobs
              </Link>
            </span>
          </div>

          <h2 className="mt-5 text-xl font-semibold tracking-tight">
            {job?.title ?? (loading ? "Loading…" : "Not found")}
          </h2>

          <p className="mt-2 text-white/70 text-sm">
            {(job?.company ?? "—")}{job?.location ? ` · ${job.location}` : ""}{job?.work_mode ? ` · ${job.work_mode}` : ""}
          </p>

          <div className="mt-3">{statusBadge(job?.status ?? "draft")}</div>

          <Divider className="my-6" />

          <div className="grid gap-3">
            <Metric label="Candidates" value={String(totalCandidates)} />
            <Metric label="Skills" value={String(job?.skills?.length ?? 0)} />
          </div>

          <Divider className="my-6" />

          <div className="grid gap-2">
            <p className="text-xs text-white/50">Visibility</p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy || loading || !job}
                onClick={() => setJobStatus("draft")}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 disabled:opacity-60"
              >
                Draft
              </button>
              <button
                type="button"
                disabled={busy || loading || !job}
                onClick={() => setJobStatus("open")}
                className="flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 disabled:opacity-60"
              >
                Publish
              </button>
            </div>

            <button
              type="button"
              disabled={busy || loading || !job}
              onClick={() => setJobStatus("closed")}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 disabled:opacity-60"
            >
              Close role
            </button>

            <p className="text-xs text-white/40">
              Public jobs appear only when status is <span className="text-white/60">open</span>.
            </p>
          </div>

          {job?.skills?.length ? (
            <>
              <Divider className="my-6" />
              <p className="text-xs text-white/50">Target skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.skills.slice(0, 18).map((s) => (
                  <span
                    key={s}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </Card>

        {/* Right: Candidate pipeline */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <Badge>Pipeline</Badge>
            <span className="text-xs text-white/50">{busy ? "Updating…" : loading ? "Loading…" : "Hiring"}</span>
          </div>

          <h3 className="mt-5 text-lg font-semibold">Candidates</h3>
          <p className="mt-2 text-white/70 text-sm">
            Deterministic scoring keeps decisions consistent. Move people through stages as you review.
          </p>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <Divider className="my-6" />

          <div className="grid gap-4">
            {STAGES.map((st) => (
              <StageSection
                key={st.key}
                stage={st.key}
                label={st.label}
                help={st.help}
                items={grouped[st.key]}
                onMove={moveCandidate}
                disabled={busy || loading}
              />
            ))}
          </div>

          {!loading && apps.length === 0 ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              No candidates yet. Once people apply from the public job board, they’ll show here automatically.
            </div>
          ) : null}
        </Card>
      </div>
    </Shell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function StageSection({
  stage,
  label,
  help,
  items,
  onMove,
  disabled,
}: {
  stage: "new" | "screening" | "interview" | "offer" | "hired" | "rejected";
  label: string;
  help: string;
  items: {
    id: string;
    candidate_user_id: string;
    match_score?: number | null;
    notes?: string | null;
    created_at?: string;
    stage: string;
  }[];
  onMove: (applicationId: string, nextStage: any) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{label}</p>
          <p className="text-xs text-white/50">{help}</p>
        </div>
        <span className="text-xs text-white/50">{items.length}</span>
      </div>

      <div className="mt-4 space-y-3">
        {items.slice(0, 12).map((a) => (
          <div key={a.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  Candidate <span className="text-white/50">#{a.candidate_user_id.slice(0, 6)}</span>
                </p>
                <p className="mt-1 text-xs text-white/60">
                  Score: <span className="text-white/80">{formatScore(a.match_score)}</span>
                  {a.created_at ? <span className="text-white/40"> · {new Date(a.created_at).toLocaleString()}</span> : null}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <StageMenu
                  current={stage}
                  disabled={disabled}
                  onSelect={(next) => onMove(a.id, next)}
                />
              </div>
            </div>

            {a.notes ? (
              <p className="mt-3 text-sm text-white/70 whitespace-pre-wrap">{a.notes}</p>
            ) : (
              <p className="mt-3 text-sm text-white/40">
                No notes yet. (Next: add a review note panel.)
              </p>
            )}
          </div>
        ))}

        {items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/10 p-4 text-sm text-white/50">
            Empty.
          </div>
        ) : null}

        {items.length > 12 ? (
          <div className="text-xs text-white/40">Showing 12 of {items.length}.</div>
        ) : null}
      </div>
    </div>
  );
}

function StageMenu({
  current,
  onSelect,
  disabled,
}: {
  current: "new" | "screening" | "interview" | "offer" | "hired" | "rejected";
  onSelect: (next: any) => void;
  disabled?: boolean;
}) {
  return (
    <select
      disabled={disabled}
      value={current}
      onChange={(e) => onSelect(e.target.value)}
      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 outline-none focus:border-white/20 disabled:opacity-60"
    >
      <option value="new">New</option>
      <option value="screening">Screening</option>
      <option value="interview">Interview</option>
      <option value="offer">Offer</option>
      <option value="hired">Hired</option>
      <option value="rejected">Rejected</option>
    </select>
  );
}

function formatScore(v?: number | null) {
  if (v === null || v === undefined) return "—";
  // numeric in Postgres sometimes arrives as string; be defensive
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n * 100)}%`;
}
