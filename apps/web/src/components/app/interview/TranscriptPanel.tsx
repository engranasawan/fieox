"use client";

import * as React from "react";
import { Badge, Card, Button, Divider } from "@/components/ui/primitives";

type TranscriptPanelProps = {
  title?: string;
  transcript?: string | null;
  draftTranscript?: string | null; // optional live partial
  isLoading?: boolean;
  keywords?: string[];
  onRegenerate?: () => void; // later: re-transcribe / improve
};

function cleanText(s: string) {
  return s
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function TranscriptPanel({
  title = "Transcript",
  transcript,
  draftTranscript,
  isLoading,
  keywords,
  onRegenerate,
}: TranscriptPanelProps) {
  const text = React.useMemo(() => {
    const base = transcript ?? "";
    return base ? cleanText(base) : "";
  }, [transcript]);

  const draft = React.useMemo(() => {
    const base = draftTranscript ?? "";
    return base ? cleanText(base) : "";
  }, [draftTranscript]);

  const hasText = !!text;
  const hasDraft = !hasText && !!draft;

  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    const toCopy = hasText ? text : hasDraft ? draft : "";
    if (!toCopy) return;
    try {
      await navigator.clipboard.writeText(toCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <Card className="p-0">
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-base font-semibold text-white">{title}</div>
            {isLoading ? <Badge>Processing</Badge> : null}
            {hasDraft ? <Badge>Draft</Badge> : null}
            {hasText ? <Badge>Ready</Badge> : null}
          </div>
          <div className="mt-1 text-sm text-white/70">
            Your answer text will appear here. You can refine later with AI.
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Button onClick={copy} disabled={!hasText && !hasDraft}>
            {copied ? "Copied" : "Copy"}
          </Button>
          {onRegenerate ? (
            <Button onClick={onRegenerate} disabled={isLoading}>
              Re-run
            </Button>
          ) : null}
        </div>
      </div>

      <Divider />

      <div className="p-4 sm:p-5">
        {keywords?.length ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {keywords.slice(0, 12).map((k, i) => (
              <Badge key={`${k}-${i}`}>{k}</Badge>
            ))}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="mt-3 h-3 w-full animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-3 w-11/12 animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-3 w-10/12 animate-pulse rounded bg-white/10" />
          </div>
        ) : hasText || hasDraft ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-white/80">
              {hasText ? text : draft}
            </pre>
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/65">
            No transcript yet. Record an answer, then we’ll attach transcription in the next step.
          </div>
        )}
      </div>
    </Card>
  );
}
