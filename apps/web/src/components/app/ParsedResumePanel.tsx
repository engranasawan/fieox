"use client";

import { useMemo, useState } from "react";
import { Badge, Card, Divider } from "@/components/ui/primitives";

type Parsed = any;

function clean(s?: string) {
  if (!s) return "";

  // Normalize whitespace/newlines
  let t = String(s).replace(/\s{2,}/g, " ").trim();

  // Fix common OCR word-splits: "Engin eer" -> "Engineer"
  // Only merges when the second chunk is tiny (<=2 chars) OR looks like a dangling suffix.
  t = t.replace(/\b([A-Za-z]{3,})\s+([A-Za-z]{1,2})\b/g, "$1$2");

  // Fix bullet prefix artifacts
  t = t.replace(/^[•·●\u2022\u00B7]\s*/g, "");

  return t.trim();
}

function formatRange(start?: string, end?: string) {
  const s = clean(start);
  const e = clean(end);
  if (!s && !e) return "";
  if (s && !e) return s;
  if (!s && e) return e;
  return `${s} — ${e}`;
}

function splitCertLine(name: string) {
  const normalized = clean(name).replace(//g, "•");
  if (!normalized) return [];
  if (normalized.includes("•")) {
    return normalized
      .split("•")
      .map((x) => clean(x))
      .filter(Boolean);
  }
  return normalized
    .split("|")
    .map((x) => clean(x))
    .filter(Boolean);
}

function uniqPreserveOrder(arr: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of arr) {
    const k = v.toLowerCase();
    if (!v) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

export default function ParsedResumePanel({ parsed }: { parsed: Parsed }) {
  const [showAllSecondary, setShowAllSecondary] = useState(false);
  const [showAllCerts, setShowAllCerts] = useState(false);

  const view = useMemo(() => {
    if (!parsed) return null;

    const basics = parsed.basics ?? {};
    const skills = parsed.skills ?? {};
    const experience = Array.isArray(parsed.experience) ? parsed.experience : [];
    const education = Array.isArray(parsed.education) ? parsed.education : [];
    const certificationsRaw = Array.isArray(parsed.certifications) ? parsed.certifications : [];
    const quality = parsed.quality ?? {};

    const name = clean(basics.name) || "Profile";
    const headline = clean(basics.headline);
    const email = clean(basics.email);
    const missing: string[] = Array.isArray(quality.missing_fields) ? quality.missing_fields : [];
    const confidence = typeof quality.confidence === "number" ? quality.confidence : null;

    const primarySkills = uniqPreserveOrder((skills.primary ?? []).map(clean).filter(Boolean));
    const secondarySkills = uniqPreserveOrder((skills.secondary ?? []).map(clean).filter(Boolean));

    // Flatten + split certifications into separate items
    const certifications: { name: string }[] = [];
    for (const c of certificationsRaw) {
      const n = clean(c?.name);
      if (!n) continue;
      for (const p of splitCertLine(n)) certifications.push({ name: p });
    }

    return {
      basics: { name, headline, email },
      skills: { primarySkills, secondarySkills },
      experience,
      education,
      certifications,
      quality: { missing, confidence },
    };
  }, [parsed]);

  if (!view) return null;

  const { basics, skills, experience, education, certifications, quality } = view;

  const secondaryToShow = showAllSecondary ? skills.secondarySkills : skills.secondarySkills.slice(0, 18);
  const certsToShow = showAllCerts ? certifications : certifications.slice(0, 10);

  return (
    <div className="grid gap-6 lg:grid-cols-3 items-start">
      {/* LEFT */}
      <div className="lg:col-span-2 min-w-0 grid gap-6">
        {/* Header */}
        <Card className="p-6 min-w-0">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <Badge>Profile</Badge>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight truncate">
                {basics.name}
              </h2>
              {basics.headline ? (
                <p className="mt-2 text-white/70">{basics.headline}</p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/60">
                {basics.email ? (
                  <span className="truncate">{basics.email}</span>
                ) : (
                  <span className="text-white/50">Email not detected</span>
                )}

                {quality.confidence !== null ? (
                  <span className="text-xs text-white/50">
                    Confidence:{" "}
                    <span className="text-white/70">
                      {Math.round(quality.confidence * 100)}%
                    </span>
                  </span>
                ) : null}
              </div>
            </div>

            {quality.missing?.length ? (
              <div className="text-right shrink-0">
                <div className="text-xs text-white/50">Review</div>
                <div className="mt-2 flex flex-wrap gap-2 justify-end max-w-[220px]">
                  {quality.missing.map((m) => (
                    <span
                      key={m}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                    >
                      {clean(m)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        {/* Skills */}
        <Card className="p-6 min-w-0">
          <div className="flex items-center justify-between">
            <Badge>Skills</Badge>
            <span className="text-xs text-white/50">
              {skills.primarySkills.length} core
            </span>
          </div>

          <Divider className="my-6" />

          {skills.primarySkills.length ? (
            <div className="flex flex-wrap gap-2">
              {skills.primarySkills.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/60">No skills detected yet.</p>
          )}

          {skills.secondarySkills.length ? (
            <>
              <Divider className="my-6" />
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/50">Additional</div>
                {skills.secondarySkills.length > 18 ? (
                  <button
                    type="button"
                    className="text-xs text-white/60 hover:text-white/80"
                    onClick={() => setShowAllSecondary((v) => !v)}
                  >
                    {showAllSecondary ? "Show less" : "Show all"}
                  </button>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {secondaryToShow.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </Card>

        {/* Experience */}
        <Card className="p-6 min-w-0">
          <div className="flex items-center justify-between">
            <Badge>Experience</Badge>
            <span className="text-xs text-white/50">{experience.length} roles</span>
          </div>

          <Divider className="my-6" />

          {experience.length ? (
            <div className="space-y-5">
              {experience.map((job: any, idx: number) => {
                const title = clean(job?.title) || "Role";
                const company = clean(job?.company);
                const location = clean(job?.location);
                const when = formatRange(job?.startDate, job?.endDate);
                const highlights = Array.isArray(job?.highlights) ? job.highlights : [];

                return (
                  <div
                    key={`${title}-${company}-${idx}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 min-w-0 overflow-hidden"
                  >
                    <div className="min-w-0">
                      <div className="text-base font-semibold min-w-0">
                        <span className="truncate inline-block max-w-full">
                          {title}
                          {company ? (
                            <>
                              <span className="text-white/50 font-normal"> · </span>
                              <span className="text-white/80 font-normal">{company}</span>
                            </>
                          ) : null}
                        </span>
                      </div>

                      {(when || location) && (
                        <div className="mt-1 text-xs text-white/60">
                          {when}
                          {location ? <span className="text-white/40"> · {location}</span> : null}
                        </div>
                      )}

                      {highlights.length ? (
                        <ul className="mt-4 space-y-2 text-sm text-white/70 list-disc pl-5 break-words">
                          {highlights.slice(0, 6).map((h: string, i: number) => (
                            <li key={i}>{clean(h)}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-white/60">No experience detected yet.</p>
          )}
        </Card>
      </div>

      {/* RIGHT */}
      <div className="lg:col-span-1 min-w-0 grid gap-6">
        {/* Education */}
        <Card className="p-6 min-w-0">
          <div className="flex items-center justify-between">
            <Badge>Education</Badge>
            <span className="text-xs text-white/50">{education.length}</span>
          </div>

          <Divider className="my-6" />

          {education.length ? (
            <div className="space-y-4">
              {education.map((e: any, idx: number) => {
                const area = clean(e?.area) || "Education";
                const institution = clean(e?.institution);
                const endDate = clean(e?.endDate);
                const score = clean(e?.score);

                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 min-w-0 overflow-hidden"
                  >
                    <div className="text-sm font-semibold">{area}</div>
                    {institution ? (
                      <div className="mt-1 text-xs text-white/60 break-words">{institution}</div>
                    ) : null}

                    {(endDate || score) && (
                      <div className="mt-2 text-xs text-white/60 flex flex-wrap gap-2">
                        {endDate ? <span>{endDate}</span> : null}
                        {endDate && score ? <span className="text-white/40">·</span> : null}
                        {score ? <span>CGPA {score}</span> : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-white/60">No education detected yet.</p>
          )}
        </Card>

        {/* Certifications */}
        <Card className="p-6 min-w-0">
          <div className="flex items-center justify-between">
            <Badge>Certifications</Badge>
            <span className="text-xs text-white/50">{certifications.length}</span>
          </div>

          <Divider className="my-6" />

          {certifications.length ? (
            <>
              <ul className="space-y-2 text-sm text-white/70 break-words">
                {certsToShow.map((c, idx) => (
                  <li
                    key={idx}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 min-w-0 overflow-hidden"
                  >
                    {clean(c.name)}
                  </li>
                ))}
              </ul>

              {certifications.length > 10 ? (
                <button
                  type="button"
                  className="mt-4 text-xs text-white/60 hover:text-white/80"
                  onClick={() => setShowAllCerts((v) => !v)}
                >
                  {showAllCerts ? "Show less" : "Show all"}
                </button>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-white/60">No certifications detected yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
