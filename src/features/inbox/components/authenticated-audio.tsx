"use client";

import { Download, Loader2, Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  downloadAuthenticatedMedia,
  useAuthenticatedMediaUrl,
} from "@/features/inbox/hooks/use-authenticated-media";
import { cn } from "@/lib/utils";

export function formatAudioDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  return `${minutes}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}

interface AuthenticatedAudioProps {
  objectId: string;
  filename: string;
}

export function AuthenticatedAudio({ objectId, filename }: AuthenticatedAudioProps) {
  const { url, loading } = useAuthenticatedMediaUrl(objectId);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [url]);

  if (loading) {
    return (
      <div className="flex min-w-52 items-center gap-2 py-1 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading audio...
      </div>
    );
  }

  if (!url) {
    return <div className="text-xs text-muted-foreground">Audio unavailable</div>;
  }

  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setPlaying(false);
      }
    } else {
      audio.pause();
    }
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio || duration <= 0) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }

  return (
    <div className="w-[min(72vw,20rem)] min-w-56 py-0.5">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
      />

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => void togglePlayback()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          aria-label={playing ? "Pause audio" : "Play audio"}
        >
          {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="relative flex h-5 items-center">
            <div className="absolute inset-x-0 h-1 rounded-full bg-black/15">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${progress}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => seek(Number(event.target.value))}
              disabled={duration <= 0}
              className={cn(
                "absolute inset-x-0 h-5 w-full cursor-pointer opacity-0",
                duration <= 0 && "cursor-not-allowed",
              )}
              aria-label="Audio progress"
            />
          </div>
          <div className="flex items-center justify-between text-[10px] tabular-nums text-muted-foreground">
            <span>{formatAudioDuration(currentTime)}</span>
            <span>{formatAudioDuration(duration)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void downloadAuthenticatedMedia(objectId, filename)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label={`Download ${filename}`}
          title="Download audio"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-1 flex items-center gap-1.5 truncate text-[10px] text-muted-foreground">
        <Volume2 className="h-3 w-3 shrink-0" />
        <span className="truncate">{filename || "Voice note"}</span>
      </div>
    </div>
  );
}
