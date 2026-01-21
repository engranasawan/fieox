"use client";

import { useState } from "react";
import { Shell } from "@/components/ui/Shell";
import TopNav from "@/components/app/TopNav";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { Badge, Card, Divider } from "@/components/ui/primitives";

import ParsedResumePanel from "@/components/app/ParsedResumePanel";
import { supabase } from "@/lib/supabaseClient";
import { apiFetch } from "@/lib/apiClient";

export default function AppHome() {
  const { ready } = useAuthGuard();
  const [parsed, setParsed] = useState<any>(null);

  if (!ready) return null;

  return (
    <Shell
      title="FiEox Dashboard"
      subtitle="Your career workspace — resumes, applications, interview lab, and insights."
      topNav={<TopNav />}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Job Tracker (main) */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <Badge>Job Tracker</Badge>
            <span className="text-xs text-white/50">Pipeline</span>
          </div>

          <h2 className="mt-5 text-xl font-semibold tracking-tight">
            Track applications like a product pipeline
          </h2>
          <p className="mt-2 text-white/70">
            Saved → Applied → Interview → Offer → Hired. A clean workflow with history, reminders, and outcomes.
          </p>

          <Divider className="my-6" />

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/60">Saved</p>
              <p className="mt-1 text-2xl font-semibold">0</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/60">Applied</p>
              <p className="mt-1 text-2xl font-semibold">0</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/60">Interviews</p>
              <p className="mt-1 text-2xl font-semibold">0</p>
            </div>
          </div>
        </Card>

        {/* Right column */}
        <div className="grid gap-6">
          <ResumeUploadCard onParsed={setParsed} />

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <Badge>Next</Badge>
              <span className="text-xs text-white/50">Roadmap</span>
            </div>

            <h3 className="mt-5 text-lg font-semibold">Build a role-ready profile</h3>
            <p className="mt-2 text-white/70 text-sm">
              Upload your resume, extract structured profile data, then generate ATS-optimized variants and tailored cover letters.
            </p>

            <Divider className="my-6" />

            <ol className="space-y-2 text-sm text-white/70 list-decimal list-inside">
              <li>Resume library + versions</li>
              <li>Application Kanban with notes</li>
              <li>Interview Lab (question bank + drills)</li>
              <li>Insights (patterns, gaps, suggestions)</li>
            </ol>
          </Card>
        </div>
      </div>

      {/* Parsed Profile (high-end UI, no JSON blob) */}
      {parsed && (
        <div className="mt-6">
          <ParsedResumePanel parsed={parsed} />
        </div>
      )}
    </Shell>
  );
}

function ResumeUploadCard({ onParsed }: { onParsed?: (p: any) => void }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Upload a resume to generate your profile.");
  const [busy, setBusy] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

  const uploadFlow = async (file: File) => {
    setBusy(true);
    setResumeId(null);

    try {
      setFileName(file.name);
      setStatus("Preparing your resume…");

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const userId = data.session?.user?.id;

      if (!token || !userId) throw new Error("Session expired. Please sign in again.");

      // 1) Create DB row
      const createRes = await fetch(`${baseUrl}/resumes/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ file_name: file.name, mime_type: file.type }),
      });

      const created = await createRes.json();
      if (!createRes.ok) throw new Error(created.detail ?? "Resume creation failed.");

      const { resume_id, storage_path } = created;
      setResumeId(resume_id);

      // 2) Upload to Supabase Storage (bucket: resumes)
      setStatus("Uploading…");

      const uploadRes = await supabase.storage.from("resumes").upload(storage_path, file, {
        upsert: true,
        contentType: file.type || undefined,
      });

      if (uploadRes.error) throw new Error(`Upload failed: ${uploadRes.error.message}`);

      // 3) Parse
      setStatus("Parsing…");

      const parseRes = await fetch(`${baseUrl}/resumes/${resume_id}/parse`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const parsedResp = await parseRes.json();
      if (!parseRes.ok) throw new Error(parsedResp.detail ?? "Parsing failed.");

      // 4) Fetch latest parsed data
      setStatus("Finalizing…");

      const latestRes = await fetch(`${baseUrl}/resumes/latest`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const latestJson = await latestRes.json();
      if (!latestRes.ok) throw new Error(latestJson.detail ?? "Failed to load parsed profile.");

      const parsed = latestJson.item?.parsed_json ?? null;
      if (parsed) onParsed?.(parsed);

      setStatus("Profile generated ✅");
    } catch (e: any) {
      setStatus(e?.message ?? "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <Badge>Resume</Badge>
        <span className="text-xs text-white/50">Profile</span>
      </div>

      <h3 className="mt-5 text-lg font-semibold">Upload your resume</h3>
      <p className="mt-2 text-white/70 text-sm">
        We’ll turn it into a structured profile you can refine, version, and tailor to each role.
      </p>

      <Divider className="my-6" />

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        disabled={busy}
        className="block w-full text-sm text-white/70 file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold hover:file:bg-white/15 disabled:opacity-60"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          uploadFlow(f);
        }}
      />

      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
        <div className="flex items-center justify-between gap-3">
          <div className="truncate">
            <span className="text-white/50">File:</span> {fileName ?? "—"}
          </div>
          {busy ? (
            <div className="text-xs text-white/50">Working…</div>
          ) : null}
        </div>

        <div className="mt-2">
          <span className="text-white/50">Status:</span> {status}
        </div>

        {resumeId ? (
          <div className="mt-2 text-xs text-white/50">
            ID: <span className="text-white/70">{resumeId}</span>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
