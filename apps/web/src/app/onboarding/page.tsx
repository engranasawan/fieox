"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/ui/Shell";
import { Badge, Card, Divider } from "@/components/ui/primitives";

export default function OnboardingPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Preparing your workspace…");
  const [detail, setDetail] = useState("Securing session & bootstrapping profile");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setStatus("Creating your workspace…");
        setDetail("Tenant + profile, role defaults to Job Seeker (for now)");

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
        const res = await fetch(`${baseUrl}/onboarding/bootstrap`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json();

        if (!res.ok) {
          setStatus("Onboarding failed");
          setDetail(json.detail ?? "Unknown error");
          return;
        }

        setStatus(json.created ? "Workspace created ✅" : "Welcome back ✅");
        setDetail("Routing you to your dashboard…");

        // tiny delay for UX
        setTimeout(() => router.push("/app"), 600);
      } catch (e: any) {
        setStatus("Onboarding failed");
        setDetail(e?.message ?? "Unknown error");
      }
    })();
  }, [router]);

  return (
    <Shell title="Setting things up" subtitle="This takes a second — we’re preparing your FiEox workspace.">
      <div className="max-w-xl">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <Badge>Secure Onboarding</Badge>
            <div className="h-2 w-2 rounded-full bg-cyan-300/80 animate-pulse" />
          </div>

          <h2 className="mt-5 text-2xl font-semibold tracking-tight">{status}</h2>
          <p className="mt-2 text-white/70">{detail}</p>

          <Divider className="my-6" />

          <div className="space-y-2 text-sm text-white/60">
            <div className="flex items-center justify-between">
              <span>Session verified</span>
              <span className="text-white/80">✓</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tenant ready</span>
              <span className="text-white/80">…</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Profile ready</span>
              <span className="text-white/80">…</span>
            </div>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
