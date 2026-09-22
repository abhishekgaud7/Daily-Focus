"use client";

import React, { useState, useEffect } from "react";
import { DailyBlock } from "@/types/database";
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  Clock, 
  Flame, 
  PlusCircle, 
  Square,
  Sparkles
} from "lucide-react";
import { 
  timeToMinutes, 
  getCurrentTimeMinutes, 
  formatCountdown, 
  formatDuration, 
  formatFriendlyTime 
} from "@/utils/timeUtils";
import { audioAlert } from "@/utils/audioAlert";
import confetti from "canvas-confetti";

interface ActiveTaskBannerProps {
  runningBlock: DailyBlock | null;
  upcomingBlock: DailyBlock | null;
  onUpdateBlock: (id: string, updates: Partial<DailyBlock>) => Promise<DailyBlock | null>;
  onStartBlock: (block: DailyBlock) => Promise<void>;
}

export function ActiveTaskBanner({
  runningBlock,
  upcomingBlock,
  onUpdateBlock,
  onStartBlock,
}: ActiveTaskBannerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // 1-second countdown ticker active ONLY when a task is running and not paused
  useEffect(() => {
    if (!runningBlock || isPaused) return;

    const calculateRemaining = () => {
      const startMin = timeToMinutes(runningBlock.start_time);
      const endMin = timeToMinutes(runningBlock.end_time);
      const totalSeconds = (endMin - startMin) * 60;

      const now = new Date();
      const currentSecondsFromMidnight = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const endSeconds = endMin * 60;
      const remaining = Math.max(0, endSeconds - currentSecondsFromMidnight);

      const elapsed = totalSeconds - remaining;
      const pct = Math.min(100, Math.max(0, (elapsed / (totalSeconds || 1)) * 100));

      setSecondsRemaining(remaining);
      setProgressPercent(pct);
    };

    calculateRemaining();
    const timer = setInterval(calculateRemaining, 1000);
    return () => clearInterval(timer);
  }, [runningBlock, isPaused]);

  const handleComplete = async () => {
    if (!runningBlock) return;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.2 },
    });
    audioAlert.playCompletionChime();
    await onUpdateBlock(runningBlock.id, { status: "completed" });
  };

  const handleSnooze10m = async () => {
    if (!runningBlock) return;
    const endMin = timeToMinutes(runningBlock.end_time) + 10;
    const hours = Math.floor(endMin / 60);
    const mins = endMin % 60;
    const newEnd = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    const newDuration = runningBlock.duration_hours + (10 / 60);

    await onUpdateBlock(runningBlock.id, {
      end_time: newEnd,
      duration_hours: Math.round(newDuration * 100) / 100,
    });
  };

  const handleStop = async () => {
    if (!runningBlock) return;
    await onUpdateBlock(runningBlock.id, { status: "pending" });
  };

  if (runningBlock) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-zinc-900 p-4 shadow-xl shadow-emerald-950/40 backdrop-blur-md">
        {/* Dynamic Glowing Progress Bar Background */}
        <div 
          className="absolute bottom-0 left-0 top-0 bg-emerald-500/10 transition-all duration-1000 ease-linear pointer-events-none"
          style={{ width: `${progressPercent}%` }}
        />
        <div 
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Active Info */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Flame className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Active Focus
                </span>
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                  {runningBlock.category}
                </span>
              </div>
              <h2 className="mt-0.5 text-base sm:text-lg font-bold text-white tracking-tight">
                {runningBlock.task_title}
              </h2>
              <p className="text-xs text-zinc-400">
                {formatFriendlyTime(runningBlock.start_time)} – {formatFriendlyTime(runningBlock.end_time)} ({formatDuration(runningBlock.duration_hours)})
              </p>
            </div>
          </div>

          {/* Countdown & Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 self-end md:self-center">
            
            {/* Countdown Badge */}
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Remaining
              </span>
              <div className="font-mono text-2xl sm:text-3xl font-black tracking-tight text-emerald-400">
                {formatCountdown(secondsRemaining)}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleComplete}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition-transform active:scale-95 shadow-md shadow-emerald-500/30"
              >
                <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                <span>Complete</span>
              </button>

              <button
                onClick={() => setIsPaused(!isPaused)}
                className="rounded-xl border border-zinc-700 bg-zinc-800/80 p-2 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                title={isPaused ? "Resume focus timer" : "Pause focus timer"}
              >
                {isPaused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4" />}
              </button>

              <button
                onClick={handleSnooze10m}
                className="flex items-center gap-1 rounded-xl border border-zinc-700 bg-zinc-800/80 px-2.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                title="Add 10 more minutes to this focus session"
              >
                <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>+10m</span>
              </button>

              <button
                onClick={handleStop}
                className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-2 text-zinc-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                title="Stop and return to pending"
              >
                <Square className="h-4 w-4" />
              </button>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // Standby mode: Show next upcoming task if available
  if (upcomingBlock) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-700/60">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Next Scheduled Block
              </span>
              <span className="rounded bg-zinc-800/90 px-1.5 py-0.5 text-[10px] text-zinc-300">
                {upcomingBlock.category}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-zinc-200">
              {upcomingBlock.task_title}
            </h3>
            <p className="text-xs text-zinc-400">
              Starts at {formatFriendlyTime(upcomingBlock.start_time)} ({formatDuration(upcomingBlock.duration_hours)})
            </p>
          </div>
        </div>

        <button
          onClick={() => onStartBlock(upcomingBlock)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all self-start sm:self-auto"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Start Early</span>
        </button>
      </div>
    );
  }

  return null;
}
