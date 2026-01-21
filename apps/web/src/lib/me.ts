import { supabase } from "@/lib/supabaseClient";

export type MeResponse = {
  ok: boolean;
  profile: any;
  capabilities: { jobseeker: boolean; recruiter: boolean };
};

export async function fetchMe(baseUrl: string): Promise<{ token: string; me: MeResponse }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Session expired. Please sign in again.");

  const res = await fetch(`${baseUrl}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const me = await res.json();
  if (!res.ok) throw new Error(me?.detail ?? "Failed to load profile.");
  return { token, me };
}

export async function enableRecruiter(baseUrl: string, token: string) {
  const res = await fetch(`${baseUrl}/onboarding/enable_recruiter`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.detail ?? "Failed to enable recruiter workspace.");
  return json;
}
