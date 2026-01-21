"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/primitives";

export default function SurfaceSwitch() {
  const [role, setRole] = useState<"jobseeker" | "recruiter" | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;

      // This endpoint is safe to call; it returns created:false if already recruiter.
      // If you don't want auto-create recruiter tenants, change this to a "me" endpoint later.
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
      const resp = await fetch(`${baseUrl}/onboarding/bootstrap_recruiter`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) {
        setRole("jobseeker");
        return;
      }

      const json = await resp.json();
      const r = json?.profile?.role;
      setRole(r === "recruiter" ? "recruiter" : "jobseeker");
    })();
  }, []);

  if (!role) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge>Surface</Badge>
      <div className="flex items-center gap-2 text-xs">
        <Link
          href="/app"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-white/70 hover:bg-white/10"
        >
          Jobseeker
        </Link>
        <Link
          href="/recruiter"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-white/70 hover:bg-white/10"
        >
          Recruiter
        </Link>
      </div>
    </div>
  );
}
