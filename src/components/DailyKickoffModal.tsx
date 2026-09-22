"use client";

import React from "react";
import { DailyBlock } from "@/types/database";
import { 
  Sunrise, 
  X, 
  Check, 
  Clock, 
  Sparkles, 
  RotateCw, 
  Flame, 
  Calendar 
} from "lucide-react";
import { formatFriendlyTime, formatDuration, timeToMinutes } from "@/utils/timeUtils";

interface DailyKickoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: DailyBlock[];
  onShiftMorningBlocks: (minutes: number) => Promise<void>;
  onOpenOptimizer: () => void;
}

export function DailyKickoffModal({
  isOpen,
  onClose,
  blocks,
  onShiftMorningBlocks,
  onOpenOptimizer,
}: DailyKickoffModalProps) {
  if (!isOpen) return null;

  const totalBlocks = blocks.length;
  const totalHours = blocks.reduce((acc, b) => acc + (b.duration_hours || 0), 0);

  // Find first task
  const sorted = [...blocks].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  const firstBlock = sorted[0];

  // Find heaviest deep work block
  const heaviestBlock = [...blocks]
    .filter((b) => b.category === "Deep Work" || b.category === "Learning")
    .sort((a, b) => b.duration_hours - a.duration_hours)[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-amber-500/30 bg-zinc-900 p-6 sm:p-8 shadow-2xl shadow-amber-950/30">
        
        {/* Glow */}
        <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Greeting Icon */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Sunrise className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Daily Morning Kickoff
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Good Morning, Focus Achiever!
            </h2>
          </div>
        </div>

        {/* Roadmap Summary Text */}
        <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3">
          <p className="text-sm text-zinc-300 leading-relaxed">
            You have <strong className="text-emerald-400">{totalBlocks} scheduled blocks</strong> today totaling <strong className="text-emerald-400">{totalHours.toFixed(1)} focus hours</strong>.
          </p>

          {firstBlock && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 border-t border-zinc-800/80 pt-2.5">
              <Clock className="h-4 w-4 text-sky-400 shrink-0" />
              <span>
                First task begins at <strong className="text-white">{formatFriendlyTime(firstBlock.start_time)}</strong> (&quot;{firstBlock.task_title}&quot;).
              </span>
            </div>
          )}

          {heaviestBlock && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Flame className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Heaviest block: <strong className="text-white">&quot;{heaviestBlock.task_title}&quot;</strong> ({formatDuration(heaviestBlock.duration_hours)} at {formatFriendlyTime(heaviestBlock.start_time)}).
              </span>
            </div>
          )}
        </div>

        {/* Quick Shift Helper */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-400">
          <span>Woke up a bit late? Need more time?</span>
          <button
            onClick={async () => {
              await onShiftMorningBlocks(30);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            <RotateCw className="h-3 w-3" />
            <span>Shift Morning +30m</span>
          </button>
        </div>

        {/* Modal Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-bold text-zinc-950 hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Check className="h-4 w-4 stroke-[3]" />
            <span>Approve & Start Day</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenOptimizer();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-5 py-3 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all"
          >
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>Auto-Optimize Day</span>
          </button>
        </div>

      </div>
    </div>
  );
}
