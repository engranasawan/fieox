"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { supabase } from "@/lib/supabaseClient";

import InterviewLabShell from "@/components/app/interview/InterviewLabShell";
import RolePicker, { InterviewRolePreset } from "@/components/app/interview/RolePicker";
import { Button, Card, Divider, Badge } from "@/components/ui/primitives";

function defaultPresets(): InterviewRolePreset[] {
  return [
    { key: "swe_fullstack", title: "Software Engineer (Full-stack)", level: "mid" },
    { key: "swe_backend", title: "Software Engineer (Backend)", level: "mid" },
    { key: "ds_ai", title: "Data Scientist / AI Engineer", level: "junior" },
    { key: "pm", title: "Product Manager", level: "mid" },
    { key: "sales", title: "Sales / Business Development", level: "mid" },
  ];
}

export default function InterviewNewPage() {
  const router = useRouter();
  const presets = defaultPresets();

  const [selected, setSelected] = React.useState<InterviewRolePreset | null>(presets[0] ?? null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // Keep consistent with your existing pages (ResumeUploadCard uses this env too)
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

  const createSession = async () => {
    setErr(null);
    if (!selected) {
      setErr("Select a role to continue.");
      return;
    }

    setIsCreating(true);
    try {
      // ✅ same auth approach as your dashboard upload flow
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Session expired. Please sign in again.");

      const resp = await fetch(`${baseUrl}/interview/sessions/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: selected.title,
          level: selected.level ?? "mid",
          total_questions: 0,
          meta: { preset_key: selected.key },
        }),
      });

      const json = await resp.json();
      if (!resp.ok) {
        throw new Error(json?.detail ?? "Failed to create session.");
      }

      const sessionId = json?.session?.id;
      if (!sessionId) throw new Error("API returned no session id.");

      router.push(
        `/app/interview/session/${encodeURIComponent(sessionId)}?role=${encodeURIComponent(
          selected.title
        )}&level=${encodeURIComponent(selected.level ?? "mid")}`
      );
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create session.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <InterviewLabShell
      title="New Interview Session"
      subtitle="Pick a role track. We’ll generate questions and score your answers with a rubric."
      right={
        <Link href="/app/interview">
          <Button>Back</Button>
        </Link>
      }
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-white/70">
            You can run this without AI keys. We’ll keep everything deterministic for now.
          </div>
          <div className="flex items-center gap-2">
            <Badge>Draft</Badge>
            <Badge>Job Seeker</Badge>
          </div>
        </div>
      }
    >
      <div className="grid gap-4">
        <Card className="p-0">
          <div className="p-4 sm:p-5">
            <div className="text-base font-semibold text-white">Choose your role</div>
            <div className="mt-1 text-sm text-white/70">
              Start with a focused track. You can add more roles later (college + recruiter dashboards will reuse this).
            </div>
          </div>

          <Divider />

          <div className="p-4 sm:p-5">
            <RolePicker presets={presets} value={selected} onChange={setSelected} />

            {err ? <div className="mt-3 text-sm text-red-300">{err}</div> : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={createSession} disabled={isCreating || !selected}>
                {isCreating ? "Creating..." : "Create session"}
              </Button>

              <Link href="/app/interview">
                <Button disabled={isCreating}>Cancel</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </InterviewLabShell>
  );
}
