"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/ui/Shell";
import TopNav from "@/components/app/TopNav";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { Badge, Card, Divider } from "@/components/ui/primitives";
import { supabase } from "@/lib/supabaseClient";

type JobStatus = "draft" | "open" | "closed";

type Job = {
  id: string;
  title: string;
  company?: string | null;
  location?: string | null;
  work_mode?: "onsite" | "remote" | "hybrid" | null;
  status?: JobStatus | null;
  created_at?: string;
};

type MeResponse = {
  ok: boolean;
  profile?: {
    recruiter_enabled?: boolean | null;
    recruiter_tenant_id?: string | null;
  } | null;
};

export default function RecruiterJobsPage() {
  const { ready } = useAuthGuard();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<JobStatus | "all">("all");

  const [recruiterEnabled, setRecruiterEnabled] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  const baseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000",
    []
  );

  const getToken = async (): Promise<string> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Session expired. Please sign in again.");
    return token;
  };

  const refresh = async () => {
    setLoading(true);
    setGateError(null);

    try {
      const token = await getToken();

      // Gate check
      const meRes = await fetch(`${baseUrl}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meJson = (await meRes.json()) as MeResponse;

      const enabled = Boolean(meJson?.profile?.recruiter_enabled && meJson?.profile?.recruiter_tenant_id);
      setRecruiterEnabled(enabled);

      if (!enabled) {
        setJobs([]);
        return;
      }

      const res = await fetch(`${baseUrl}/recruiter/jobs/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json?.detail ?? "Failed to load recruiter jobs.");

      setJobs(json?.jobs ?? []);
    } catch (e: any) {
      setGateError(e?.message ?? "Something went wrong.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const enableRecruiter = async () => {
    setEnabling(true);
    setGateError(null);

    try {
      const token = await getToken();

      const res = await fetch(`${baseUrl}/onboarding/enable_recruiter`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail ?? "Failed to enable recruiter workspace.");

      await refresh();
    } catch (e: any) {
      setGateError(e?.message ?? "Failed to enable recruiter workspace.");
    } finally {
      setEnabling(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, baseUrl]);

  if (!ready) return null;

  // Gate UI
  if (!loading && !recruiterEnabled) {
    return (
      <Shell
        title="Jobs"
        subtitle="Enable recruiter workspace to create roles and review candidates."
        topNav={<TopNav />}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <Badge>Recruiter</Badge>
            <span className="text-xs text-white/50">Setup</span>
          </div>

          <h2 className="mt-5 text-xl font-semibold tracking-tight">Recruiter workspace required</h2>
          <p className="mt-2 text-white/70">
            Your recruiter workspace is a separate tenant used for job posts and candidate pipelines.
          </p>

          <Divider className="my-6" />

          {gateError ? (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {gateError}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-white/50">
              One-time setup. You can still use the jobseeker dashboard.
            </div>

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

  const filtered = jobs.filter((j) => {
    const matchesStatus = status === "all" ? true : j.status === status;
    const text = `${j.title ?? ""} ${j.company ?? ""} ${j.location ?? ""}`.toLowerCase();
    const matchesQ = q.trim() ? text.includes(q.trim().toLowerCase()) : true;
    return matchesStatus && matchesQ;
  });

  return (
    <Shell
      title="Jobs"
      subtitle="Create roles, publish when ready, and review candidates in a pipeline."
      topNav={<TopNav />}
    >
      <div className="grid gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge>Recruiter</Badge>
              <span className="text-xs text-white/50">Jobs</span>
            </div>

            <Link
              href="/recruiter/jobs/new"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              New job
            </Link>
          </div>

          <h2 className="mt-5 text-xl font-semibold tracking-tight">Your roles</h2>
          <p className="mt-2 text-white/70">
            Draft privately, publish when ready. Candidates and scoring appear automatically once applications come in.
          </p>

          <Divider className="my-6" />

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <StatusChip label="All" active={status === "all"} onClick={() => setStatus("all")} />
              <StatusChip label="Open" active={status === "open"} onClick={() => setStatus("open")} />
              <StatusChip label="Draft" active={status === "draft"} onClick={() => setStatus("draft")} />
              <StatusChip label="Closed" active={status === "closed"} onClick={() => setStatus("closed")} />
            </div>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, company, location…"
              className="w-full sm:w-80 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 placeholder:text-white/40 outline-none focus:border-white/20"
            />
          </div>

          <Divider className="my-6" />

          {/* List */}
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-12 bg-white/5 px-4 py-3 text-xs text-white/50">
              <div className="col-span-6">Role</div>
              <div className="col-span-3 hidden sm:block">Work</div>
              <div className="col-span-2 hidden sm:block">Status</div>
              <div className="col-span-6 sm:col-span-1 text-right">Open</div>
            </div>

            {loading ? (
              <div className="p-4 text-sm text-white/60">Loading jobs…</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-sm text-white/70">
                <p className="font-medium text-white/80">No jobs found.</p>
                <p className="mt-1 text-white/60">
                  Create a job, then publish it to show on the public job board.
                </p>
              </div>
            ) : (
              filtered.map((j) => (
                <Link
                  key={j.id}
                  href={`/recruiter/jobs/${j.id}`}
                  className="grid grid-cols-12 items-center gap-3 border-t border-white/10 px-4 py-4 hover:bg-white/5"
                >
                  <div className="col-span-12 sm:col-span-6 min-w-0">
                    <p className="truncate font-medium">{j.title}</p>
                    <p className="truncate text-xs text-white/60">
                      {j.company ?? "—"} · {j.location ?? "—"}
                    </p>
                  </div>

                  <div className="col-span-6 sm:col-span-3 text-xs text-white/60">
                    {(j.work_mode ?? "—").toString()}
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <span className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
                      {j.status ?? "—"}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1 text-right text-xs text-white/50">→</div>
                </Link>
              ))
            )}
          </div>

          {gateError ? (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {gateError}
            </div>
          ) : null}
        </Card>
      </div>
    </Shell>
  );
}

function StatusChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-xl border px-3 py-2 text-xs font-semibold transition",
        active
          ? "border-white/20 bg-white/10 text-white"
          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
      ].join(" ")}
      type="button"
    >
      {label}
    </button>
  );
}
