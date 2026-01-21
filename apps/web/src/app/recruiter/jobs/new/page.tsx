"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/ui/Shell";
import TopNav from "@/components/app/TopNav";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { Badge, Card, Divider } from "@/components/ui/primitives";
import { supabase } from "@/lib/supabaseClient";

type JobStatus = "draft" | "open" | "closed";
type WorkMode = "onsite" | "remote" | "hybrid";

type MeResponse = {
  ok: boolean;
  profile?: {
    recruiter_enabled?: boolean | null;
    recruiter_tenant_id?: string | null;
  } | null;
};

export default function RecruiterNewJobPage() {
  const { ready } = useAuthGuard();
  const router = useRouter();

  const baseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000",
    []
  );

  const [gateLoading, setGateLoading] = useState(true);
  const [recruiterEnabled, setRecruiterEnabled] = useState(false);
  const [enabling, setEnabling] = useState(false);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("remote");
  const [status, setStatus] = useState<JobStatus>("draft");
  const [description, setDescription] = useState("");

  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>(["python", "fastapi", "postgres"]);

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

  useEffect(() => {
    if (!ready) return;
    refreshGate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, baseUrl]);

  if (!ready) return null;

  const canSubmit = title.trim().length >= 2 && company.trim().length >= 2 && !busy;

  const addSkill = () => {
    const s = skillInput.trim().toLowerCase();
    if (!s) return;
    if (skills.includes(s)) {
      setSkillInput("");
      return;
    }
    setSkills((prev) => [...prev, s].slice(0, 25));
    setSkillInput("");
  };

  const removeSkill = (s: string) => setSkills((prev) => prev.filter((x) => x !== s));

  const submit = async (nextStatus?: JobStatus) => {
    setError(null);
    setBusy(true);

    try {
      const token = await getToken();

      // Hard gate: do not attempt create if recruiter not enabled
      const meRes = await fetch(`${baseUrl}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meJson = (await meRes.json()) as MeResponse;
      const enabled = Boolean(meJson?.profile?.recruiter_enabled && meJson?.profile?.recruiter_tenant_id);
      if (!enabled) throw new Error("Recruiter workspace not enabled. Enable it to create jobs.");

      const payload = {
        title: title.trim(),
        company: company.trim(),
        location: location.trim() || null,
        work_mode: workMode,
        description: description.trim() || null,
        skills,
        status: nextStatus ?? status,
      };

      const res = await fetch(`${baseUrl}/recruiter/jobs/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail ?? "Failed to create job.");

      const jobId = json?.job?.id;
      if (!jobId) throw new Error("Job created but no id returned.");

      router.push(`/recruiter/jobs/${jobId}`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create job.");
    } finally {
      setBusy(false);
    }
  };

  // -------------------------
  // Gate UI
  // -------------------------
  if (!gateLoading && !recruiterEnabled) {
    return (
      <Shell
        title="Create job"
        subtitle="Enable recruiter workspace to create roles and publish them."
        topNav={<TopNav />}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <Badge>Recruiter</Badge>
              <span className="text-xs text-white/50">Setup</span>
            </div>

            <h2 className="mt-5 text-xl font-semibold tracking-tight">Recruiter workspace required</h2>
            <p className="mt-2 text-white/70">
              Creating jobs happens inside a separate recruiter tenant — isolated from your jobseeker data.
            </p>

            <Divider className="my-6" />

            {error ? (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-white/50">One-time setup. Takes a few seconds.</div>

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
              <Badge>What happens</Badge>
              <span className="text-xs text-white/50">MVP</span>
            </div>

            <Divider className="my-6" />

            <ul className="space-y-2 text-sm text-white/70">
              <li>• We create a recruiter tenant</li>
              <li>• We link it to your profile</li>
              <li>• Recruiter routes start working immediately</li>
            </ul>
          </Card>
        </div>
      </Shell>
    );
  }

  // -------------------------
  // Main Create Job UI
  // -------------------------
  return (
    <Shell
      title="Create job"
      subtitle="Start as a draft. Publish when you’re ready to receive candidates."
      topNav={<TopNav />}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main editor */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <Badge>Recruiter</Badge>
            <span className="text-xs text-white/50">{gateLoading ? "Loading…" : "New role"}</span>
          </div>

          <h2 className="mt-5 text-xl font-semibold tracking-tight">Role details</h2>
          <p className="mt-2 text-white/70">
            Keep it tight. Title + skills matter most. You can refine the description later.
          </p>

          <Divider className="my-6" />

          <div className="grid gap-4">
            <Field label="Job title" hint="Example: Backend Engineer (FastAPI)">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Backend Engineer (FastAPI)"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 placeholder:text-white/40 outline-none focus:border-white/20"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company" hint="Displayed publicly when job is open">
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="FiEox Labs"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 placeholder:text-white/40 outline-none focus:border-white/20"
                />
              </Field>

              <Field label="Location" hint="Optional">
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Remote / Karachi / London"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 placeholder:text-white/40 outline-none focus:border-white/20"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Work mode">
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none focus:border-white/20"
                >
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">Onsite</option>
                </select>
              </Field>

              <Field label="Status">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as JobStatus)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 outline-none focus:border-white/20"
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open (public)</option>
                  <option value="closed">Closed</option>
                </select>
              </Field>
            </div>

            <Field label="Description" hint="Optional for now — candidates still get scored by skills + resume">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary, responsibilities, must-haves…"
                rows={7}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 placeholder:text-white/40 outline-none focus:border-white/20"
              />
            </Field>
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <Divider className="my-6" />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-white/50">Tip: start with a draft. Publish when title + skills look right.</div>

            <div className="flex gap-2">
              <button
                disabled={!canSubmit}
                onClick={() => submit("draft")}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 disabled:opacity-60"
                type="button"
              >
                {busy ? "Working…" : "Save draft"}
              </button>

              <button
                disabled={!canSubmit}
                onClick={() => submit("open")}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 disabled:opacity-60"
                type="button"
              >
                {busy ? "Working…" : "Publish"}
              </button>
            </div>
          </div>
        </Card>

        {/* Skills + guidance */}
        <div className="grid gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <Badge>Skills</Badge>
              <span className="text-xs text-white/50">{skills.length}/25</span>
            </div>

            <h3 className="mt-5 text-lg font-semibold">What should match?</h3>
            <p className="mt-2 text-white/70 text-sm">
              Skills drive deterministic scoring. Keep them normalized and specific.
            </p>

            <Divider className="my-6" />

            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Add skill (e.g., redis)"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 placeholder:text-white/40 outline-none focus:border-white/20"
              />
              <button
                type="button"
                onClick={addSkill}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
              >
                Add
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => removeSkill(s)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
                  title="Remove"
                >
                  {s} <span className="text-white/40">×</span>
                </button>
              ))}
              {skills.length === 0 ? (
                <div className="text-sm text-white/60">Add a few must-have skills to start.</div>
              ) : null}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <Badge>Quality</Badge>
              <span className="text-xs text-white/50">MVP</span>
            </div>

            <h3 className="mt-5 text-lg font-semibold">Publishing checklist</h3>
            <Divider className="my-6" />

            <ul className="space-y-2 text-sm text-white/70">
              <li>• Title is specific (seniority + stack)</li>
              <li>• 6–12 skills max (avoid duplicates)</li>
              <li>• Work mode + location are clear</li>
              <li>• Description can be short for now</li>
            </ul>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        {hint ? <p className="text-xs text-white/50">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}
