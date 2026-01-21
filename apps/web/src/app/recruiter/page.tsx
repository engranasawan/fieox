"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/ui/Shell";
import TopNav from "@/components/app/TopNav";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { Badge, Card, Divider } from "@/components/ui/primitives";
import { supabase } from "@/lib/supabaseClient";

type Job = {
  id: string;
  title: string;
  company?: string | null;
  location?: string | null;
  status?: "draft" | "open" | "closed";
  created_at?: string;
};

type MeResponse = {
  ok: boolean;
  profile?: {
    role?: string | null;
    recruiter_enabled?: boolean | null;
    recruiter_tenant_id?: string | null;
  } | null;
};

export default function RecruiterHome() {
  const { ready } = useAuthGuard();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [recruiterEnabled, setRecruiterEnabled] = useState<boolean>(false);
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

      // 1) Check "me" to know if recruiter workspace is enabled
      const meRes = await fetch(`${baseUrl}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meJson = (await meRes.json()) as MeResponse;

      const enabled = Boolean(meJson?.profile?.recruiter_enabled && meJson?.profile?.recruiter_tenant_id);
      setRecruiterEnabled(enabled);

      // 2) If not enabled, stop here and show gate UI
      if (!enabled) {
        setJobs([]);
        return;
      }

      // 3) Load recruiter jobs
      const res = await fetch(`${baseUrl}/recruiter/jobs/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.detail ?? "Failed to load recruiter jobs.");
      }

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
      if (!res.ok) {
        throw new Error(json?.detail ?? "Failed to enable recruiter workspace.");
      }

      // After enabling, refresh screen data
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

  const openCount = jobs.filter((j) => j.status === "open").length;
  const draftCount = jobs.filter((j) => j.status === "draft").length;

  // -------------------------
  // Gate UI (premium + explicit conversion)
  // -------------------------
  if (!loading && !recruiterEnabled) {
    return (
      <Shell
        title="Recruiter Panel"
        subtitle="Enable your recruiter workspace to create jobs and review candidates."
        topNav={<TopNav />}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <Badge>Recruiter</Badge>
              <span className="text-xs text-white/50">Setup</span>
            </div>

            <h2 className="mt-5 text-xl font-semibold tracking-tight">
              Create a recruiter workspace
            </h2>
            <p className="mt-2 text-white/70">
              You’ll get a separate recruiter tenant (workspace) for jobs and candidate pipelines — isolated from your
              jobseeker data.
            </p>

            <Divider className="my-6" />

            {gateError ? (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {gateError}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-white/50">
                This is a one-time setup. You can still use the jobseeker dashboard.
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

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <Badge>What you get</Badge>
              <span className="text-xs text-white/50">MVP</span>
            </div>

            <Divider className="my-6" />

            <ul className="space-y-2 text-sm text-white/70">
              <li>• Jobs: draft → open → closed</li>
              <li>• Candidate pipeline: new → screening → interview</li>
              <li>• Deterministic match scoring (no LLM)</li>
              <li>• Clean reviewer UI (no raw JSON)</li>
            </ul>
          </Card>
        </div>
      </Shell>
    );
  }

  // -------------------------
  // Recruiter Home
  // -------------------------
  return (
    <Shell
      title="Recruiter Panel"
      subtitle="Create jobs, review candidates, move them through a clean hiring pipeline."
      topNav={<TopNav />}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <Badge>Pipeline</Badge>
            <span className="text-xs text-white/50">{loading ? "Loading…" : "Hiring"}</span>
          </div>

          <h2 className="mt-5 text-xl font-semibold tracking-tight">A calm hiring cockpit</h2>
          <p className="mt-2 text-white/70">
            Jobs on the left, candidates on the right. Fast decisions with consistent scoring.
          </p>

          <Divider className="my-6" />

          <div className="grid sm:grid-cols-3 gap-3">
            <Metric label="Open jobs" value={String(openCount)} />
            <Metric label="Draft jobs" value={String(draftCount)} />
            <Metric label="Candidates" value="0" hint="(will populate after applications)" />
          </div>

          <Divider className="my-6" />

          <div className="flex gap-3">
            <Link
              href="/recruiter/jobs"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              View jobs
            </Link>
            <Link
              href="/recruiter/jobs/new"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
            >
              Create job
            </Link>
          </div>

          {gateError ? (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {gateError}
            </div>
          ) : null}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <Badge>Jobs</Badge>
            <span className="text-xs text-white/50">{loading ? "Loading…" : `${jobs.length} total`}</span>
          </div>

          <h3 className="mt-5 text-lg font-semibold">Recent jobs</h3>
          <p className="mt-2 text-white/70 text-sm">
            Open a job to see candidates and move them through stages.
          </p>

          <Divider className="my-6" />

          <div className="space-y-3">
            {(jobs.slice(0, 5) || []).map((j) => (
              <Link
                key={j.id}
                href={`/recruiter/jobs/${j.id}`}
                className="block rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{j.title}</p>
                    <p className="truncate text-xs text-white/60">
                      {j.company ?? "—"} · {j.location ?? "—"}
                    </p>
                  </div>
                  <span className="text-xs text-white/50">{j.status ?? "—"}</span>
                </div>
              </Link>
            ))}

            {jobs.length === 0 && !loading ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                No jobs yet. Create your first job to start receiving candidates.
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </Shell>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-white/40">{hint}</p> : null}
    </div>
  );
}
