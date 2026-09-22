"use client";

import React from "react";
import { DailyBlock } from "@/types/database";
import { 
  BellRing, 
  Play, 
  Clock, 
  X, 
  RotateCcw, 
  Check, 
  AlertCircle 
} from "lucide-react";
import { formatDuration, formatFriendlyTime } from "@/utils/timeUtils";

interface TaskAlertModalProps {
  block: DailyBlock | null;
  onStartFocus: (block: DailyBlock) => void;
  onSnooze: (block: DailyBlock, minutes: number) => void;
  onSkip: (block: DailyBlock) => void;
  onDismiss: () => void;
}

export function TaskAlertModal({
  block,
  onStartFocus,
  onSnooze,
  onSkip,
  onDismiss,
}: TaskAlertModalProps) {
  if (!block) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border-2 border-emerald-500/50 bg-zinc-900 p-6 sm:p-8 shadow-2xl shadow-emerald-500/20"
        role="dialog"
        aria-modal="true"
      >
        {/* Glowing Background Radial */}
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="absolute right-5 top-5 rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          title="Dismiss Alert"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Alert Icon & Badge */}
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner">
            <BellRing className="h-7 w-7 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                Scheduled Transition
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {formatFriendlyTime(block.start_time)}
              </span>
            </div>
            <h2 className="mt-1 text-xl sm:text-2xl font-black text-white tracking-tight">
              Time for: {block.task_title}
            </h2>
          </div>
        </div>

        {/* Details Card */}
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Duration:</span>
            <span className="font-semibold text-zinc-200 font-mono">
              {formatDuration(block.duration_hours)} ({formatFriendlyTime(block.start_time)} – {formatFriendlyTime(block.end_time)})
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Category:</span>
            <span className="font-medium text-emerald-400">{block.category}</span>
          </div>
          {block.notes && (
            <div className="pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
              <span className="font-medium text-zinc-300">Focus Goal: </span>
              {block.notes}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Start Focus Mode Button */}
          <button
            onClick={() => onStartFocus(block)}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3.5 text-sm font-bold text-zinc-950 hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-emerald-500/30 sm:col-span-1"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Start Focus</span>
          </button>

          {/* Snooze 10 Mins Button */}
          <button
            onClick={() => onSnooze(block, 10)}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/90 px-4 py-3.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all sm:col-span-1"
          >
            <Clock className="h-4 w-4 text-amber-400" />
            <span>Snooze 10m</span>
          </button>

          {/* Skip Button */}
          <button
            onClick={() => onSkip(block)}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-all sm:col-span-1"
          >
            <span>Skip Task</span>
          </button>
        </div>

      </div>
    </div>
  );
}
