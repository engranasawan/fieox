"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/ui/Shell";
import { Badge, Button, Card, Divider, Input } from "@/components/ui/primitives";

type OAuthProvider = "google" | "linkedin_oidc" | "github" | "azure" | "apple";

interface ProviderConfig {
  label: string;
  provider: OAuthProvider;
  enabled: boolean;
  icon: React.ReactNode;
  color?: string;
  fullWidth?: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const providers: ProviderConfig[] = [
    {
      label: "Continue with Google",
      provider: "google",
      enabled: true,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      ),
    },
    {
      label: "Continue with GitHub",
      provider: "github",
      enabled: false,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ),
      color: "text-white",
    },
    {
      label: "Continue with Microsoft",
      provider: "azure",
      enabled: false,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#f25022" d="M0 0h11.377v11.372H0z" />
          <path fill="#00a4ef" d="M12.623 0H24v11.372H12.623z" />
          <path fill="#7fba00" d="M0 12.623h11.377V24H0z" />
          <path fill="#ffb900" d="M12.623 12.623H24V24H12.623z" />
        </svg>
      ),
    },
    {
      label: "Continue with Apple",
      provider: "apple",
      enabled: false,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.94 5.19A4.38 4.38 0 0 0 16 2a4.44 4.44 0 0 0-3 1.52 4.17 4.17 0 0 0-1 3.09 3.69 3.69 0 0 0 2.94-1.42zm2.52 7.44a4.51 4.51 0 0 1 2.16-3.81 4.66 4.66 0 0 0-3.66-2c-1.56-.16-3 .91-3.83.91s-2-.89-3.3-.87a4.92 4.92 0 0 0-4.14 2.53C2.93 12.45 4.24 17 6 19.47c.8 1.21 1.8 2.58 3.12 2.53s1.75-.76 3.28-.76 2 .76 3.3.73 2.22-1.24 3.06-2.45a11 11 0 0 0 1.38-2.85 4.41 4.41 0 0 1-2.68-4.04z" />
        </svg>
      ),
      color: "text-white",
    },
    {
      label: "Continue with LinkedIn",
      provider: "linkedin_oidc",
      enabled: false,
      icon: (
        <svg className="w-5 h-5" fill="#0077B5" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      fullWidth: true, // LinkedIn should be full width
    },
  ];

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 6 && !busy;
  }, [email, password, busy]);

  const submit = async () => {
    setMsg(null);
    setBusy(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) return setMsg(error.message);
        setMsg("Signup successful. Please login to continue.");
        setMode("login");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setMsg(error.message);

      router.push("/onboarding");
    } finally {
      setBusy(false);
    }
  };

  const signInWithProvider = async (provider: OAuthProvider) => {
    setMsg(null);
    setBusy(true);

    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/onboarding`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo,
        },
      });

      if (error) setMsg(error.message);
    } finally {
      setBusy(false);
    }
  };

  const ProviderButton = ({ label, provider, enabled, icon, color, fullWidth }: ProviderConfig) => (
    <Button
      variant="secondary"
      className={`${fullWidth ? 'w-full' : 'w-full'} justify-center gap-3`}
      onClick={() =>
        enabled
          ? signInWithProvider(provider)
          : setMsg(`${label.replace("Continue with ", "")} sign-in will be enabled after provider setup.`)
      }
      disabled={busy}
      type="button"
    >
      <span className={`${color || "text-white"} flex-shrink-0`}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Button>
  );

  // Filter providers into grid providers and full-width providers
  const gridProviders = providers.filter(p => !p.fullWidth);
  const fullWidthProviders = providers.filter(p => p.fullWidth);

  return (
    <Shell
      title="Welcome to FiEox"
      subtitle="A career OS for job seekers, recruiters and institutions - built for clarity, confidence, and speed."
    >
      <div className="grid lg:grid-cols-2 gap-8 items-stretch">
        {/* Left marketing panel - now matches height */}
        <Card className="p-6 lg:p-8 flex flex-col h-full">
          <div className="flex items-center justify-between">
            <Badge>AI Career Platform</Badge>
            <span className="text-xs text-white/50">v0.0.1</span>
          </div>

          <div className="flex-grow">
            <h2 className="mt-6 text-2xl font-semibold tracking-tight">
              Design-first. Career-smart. Built to feel effortless.
            </h2>
            <p className="mt-2 text-white/70">
              Resume builder, ATS optimization, job tracking, recruiter dashboards, interview lab - all in one loop.
            </p>

            <Divider className="my-6" />

            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex gap-2">
                <span className="text-cyan-300">●</span>
                One-click onboarding into your workspace (tenant + profile)
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-300">●</span>
                Role-ready foundation: JobSeeker / Recruiter / College / Admin
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-300">●</span>
                Built for self-hosted models later (Mistral/Llama), minimal burn
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-300">●</span>
                Real-time job matching and interview preparation tools
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-300">●</span>
                Comprehensive analytics dashboard for career growth tracking
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-white/50">
              Trusted by 10,000+ professionals and 500+ institutions worldwide.
            </p>
          </div>
        </Card>

        {/* Auth card */}
        <Card className="p-6 lg:p-8 flex flex-col h-full">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">
                {mode === "login" ? "Sign in" : "Create account"}
              </h3>
              <p className="text-sm text-white/60 mt-1">
                {mode === "login"
                  ? "Pick a sign-in method, then continue to onboarding."
                  : "Create your account in seconds."}
              </p>
            </div>

            <Button
              variant="ghost"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-white/70"
              disabled={busy}
              type="button"
            >
              {mode === "login" ? "Switch to Sign up" : "Switch to Login"}
            </Button>
          </div>

          <Divider className="my-6" />

          {/* Social sign-in */}
          <div className="space-y-3 flex-grow">
            <div className="grid sm:grid-cols-2 gap-2">
              {gridProviders.map((provider) => (
                <ProviderButton key={provider.provider} {...provider} />
              ))}
            </div>

            {/* LinkedIn button - full width */}
            {fullWidthProviders.map((provider) => (
              <ProviderButton key={provider.provider} {...provider} />
            ))}

            <div className="flex items-center gap-3 py-4">
              <div className="h-px w-full bg-white/10" />
              <span className="text-xs text-white/50 shrink-0">or continue with email</span>
              <div className="h-px w-full bg-white/10" />
            </div>

            {/* Email/password */}
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/60 block mb-2">Email</label>
                <Input
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={busy}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-2">Password</label>
                <Input
                  placeholder="Minimum 6 characters"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  disabled={busy}
                  className="w-full"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button 
                  onClick={submit} 
                  disabled={!canSubmit} 
                  className="w-full flex-1" 
                  type="button"
                >
                  {busy ? "Please wait..." : mode === "login" ? "Login" : "Sign up"}
                </Button>

                <Button
                  variant="secondary"
                  className="w-full flex-1"
                  onClick={() => {
                    setEmail("");
                    setPassword("");
                    setMsg(null);
                  }}
                  disabled={busy}
                  type="button"
                >
                  Clear
                </Button>
              </div>

              {msg && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                  {msg}
                </div>
              )}

              <p className="text-xs text-white/50 pt-4 border-t border-white/10">
                By continuing, you agree to our Terms of Service and Privacy Policy.
                We'll email you with product updates and career tips.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Shell>
  );
}