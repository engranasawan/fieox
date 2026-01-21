"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Badge, Button, Input, Card, Divider } from "@/components/ui/primitives";

function initialsFromEmail(email?: string | null) {
  if (!email) return "U";
  const base = email.split("@")[0] || "user";
  const parts = base.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/);
  const a = (parts[0]?.[0] ?? "U").toUpperCase();
  const b = (parts[1]?.[0] ?? parts[0]?.[1] ?? "").toUpperCase();
  return (a + b).slice(0, 2);
}

export default function TopNav() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setEmail(data.user?.email ?? null);
    };

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const initials = useMemo(() => initialsFromEmail(email), [email]);

  const logout = async () => {
    setBusy(true);
    try {
      await supabase.auth.signOut();
      router.replace("/login");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sticky top-0 z-40 -mx-6 -mt-10 mb-6 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6 py-3">
        <div className="flex items-center gap-3">
          {/* Brand */}
          <button
            type="button"
            onClick={() => router.push("/app")}
            className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-white/5 transition"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400/30 to-fuchsia-400/20 border border-white/10 flex items-center justify-center">
              <span className="font-semibold tracking-tight">F</span>
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-semibold leading-4">FiEox</div>
              <div className="text-[11px] text-white/50 leading-4">
                Dashboard
              </div>
            </div>
          </button>

          {/* Search (placeholder for now) */}
          <div className="hidden md:block flex-1">
            <Input
              placeholder="Search jobs, companies, resumes…"
              className="w-full bg-white/5 border-white/10"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <Badge>MVP</Badge>
            </div>

            <Button
              type="button"
              onClick={() => alert("Next: New Application modal")}
              className="hidden sm:inline-flex"
            >
              + New
            </Button>

            {/* User menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 transition"
              >
                <div className="h-8 w-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-sm font-semibold">
                  {initials}
                </div>
                <span className="hidden sm:block text-xs text-white/70 max-w-[220px] truncate">
                  {email ?? "Signed in"}
                </span>
                <span className="text-white/50">▾</span>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-[320px]">
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center font-semibold">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {email ?? "Signed in"}
                        </div>
                        <div className="text-xs text-white/60">
                          Job Seeker · Free Tier
                        </div>
                      </div>
                    </div>

                    <Divider className="my-4" />

                    <div className="grid gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="justify-start"
                        onClick={() => alert("Next: Profile page")}
                      >
                        👤 Profile
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        className="justify-start"
                        onClick={() => alert("Next: Settings page")}
                      >
                        ⚙️ Settings
                      </Button>

                      <Divider className="my-1" />

                      <Button
                        type="button"
                        onClick={logout}
                        disabled={busy}
                        className="justify-start"
                      >
                        {busy ? "Signing out…" : "↩ Logout"}
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* mobile search */}
        <div className="mt-3 md:hidden">
          <Input
            placeholder="Search jobs, companies, resumes…"
            className="w-full bg-white/5 border-white/10"
          />
        </div>
      </div>
    </div>
  );
}
