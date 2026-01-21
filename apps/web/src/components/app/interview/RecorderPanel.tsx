"use client";

import * as React from "react";
import { Badge, Button, Card, Divider } from "@/components/ui/primitives";

export type RecordedAudio = {
  blob: Blob;
  mimeType: string;
  durationMs: number;
  url: string;
};

export type RecorderPanelProps = {
  title?: string;
  subtitle?: string;

  disabled?: boolean;
  maxSeconds?: number; // optional cap

  onRecorded?: (audio: RecordedAudio) => void;
  onCleared?: () => void;
};

function fmtTime(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function RecorderPanel({
  title = "Recorder",
  subtitle = "Record a concise answer. You can re-record as needed.",
  disabled = false,
  maxSeconds,
  onRecorded,
  onCleared,
}: RecorderPanelProps) {
  const [supported, setSupported] = React.useState(true);
  const [isRecording, setIsRecording] = React.useState(false);
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const [audio, setAudio] = React.useState<RecordedAudio | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const streamRef = React.useRef<MediaStream | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const tickRef = React.useRef<number | null>(null);
  const startedAtRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined";

    setSupported(ok);
    if (!ok) setError("Audio recording is not supported in this browser.");
  }, []);

  React.useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      if (audio?.url) URL.revokeObjectURL(audio.url);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    if (disabled) return;
    setError(null);

    try {
      // clear any previous url
      if (audio?.url) URL.revokeObjectURL(audio.url);
      setAudio(null);
      onCleared?.();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // pick a good mime if available
      const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/mpeg",
      ];
      const mimeType = candidates.find((m) => MediaRecorder.isTypeSupported(m)) || "";

      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      rec.onstop = () => {
        const mt = rec.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mt });
        const url = URL.createObjectURL(blob);

        const startedAt = startedAtRef.current ?? Date.now();
        const durationMs = Math.max(0, Date.now() - startedAt);

        const payload: RecordedAudio = { blob, mimeType: mt, durationMs, url };
        setAudio(payload);
        onRecorded?.(payload);

        // stop tracks after recording ends
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      rec.start();
      setIsRecording(true);
      startedAtRef.current = Date.now();
      setElapsedMs(0);

      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = window.setInterval(() => {
        const startedAt = startedAtRef.current ?? Date.now();
        const ms = Date.now() - startedAt;
        setElapsedMs(ms);

        if (maxSeconds && ms >= maxSeconds * 1000) {
          stop();
        }
      }, 200);
    } catch (e: any) {
      setError(e?.message ?? "Could not start recording.");
      setIsRecording(false);
    }
  };

  const stop = () => {
    if (disabled) return;

    try {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;

      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      setIsRecording(false);
    } catch (e: any) {
      setError(e?.message ?? "Could not stop recording.");
    }
  };

  const clear = () => {
    if (disabled) return;

    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = null;

    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    } catch {
      // ignore
    }

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (audio?.url) URL.revokeObjectURL(audio.url);
    setAudio(null);
    setElapsedMs(0);
    setIsRecording(false);
    setError(null);
    onCleared?.();
  };

  if (!supported) {
    return (
      <Card className="p-4 sm:p-5">
        <div className="text-sm font-medium text-white">Recorder</div>
        <div className="mt-1 text-sm text-white/70">
          Audio recording isn’t supported in this browser environment.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-white/85">{title}</div>
            <div className="mt-1 text-sm text-white/65">{subtitle}</div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-xs uppercase tracking-wide text-white/50">Timer</div>
            <div className="mt-1 font-mono text-lg text-white">{fmtTime(elapsedMs)}</div>
          </div>
        </div>

        {error ? <div className="mt-3 text-sm text-red-200">{error}</div> : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!isRecording ? (
            <Button onClick={start} disabled={disabled}>
              Start
            </Button>
          ) : (
            <Button onClick={stop} disabled={disabled}>
              Stop
            </Button>
          )}

          <Button onClick={clear} disabled={disabled}>
            Clear
          </Button>

          {isRecording ? <Badge>Recording</Badge> : audio ? <Badge>Captured</Badge> : <Badge>Idle</Badge>}

          {maxSeconds ? <Badge>Max {maxSeconds}s</Badge> : null}
        </div>
      </div>

      {audio ? (
        <>
          <Divider />
          <div className="p-4 sm:p-5">
            <div className="text-xs uppercase tracking-wide text-white/50">Playback</div>
            <audio className="mt-2 w-full" controls src={audio.url} />
          </div>
        </>
      ) : null}
    </Card>
  );
}
