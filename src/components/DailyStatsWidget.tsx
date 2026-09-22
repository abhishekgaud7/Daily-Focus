"use client";

import React from "react";
import { DailyBlock, Category } from "@/types/database";
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Flame, 
  PieChart, 
  Download, 
  RotateCcw,
  Sparkles
} from "lucide-react";
import { formatDuration } from "@/utils/timeUtils";

interface DailyStatsWidgetProps {
  blocks: DailyBlock[];
  onResetSeed: () => void;
}

export function DailyStatsWidget({ blocks, onResetSeed }: DailyStatsWidgetProps) {
  const totalBlocks = blocks.length;
  const completedBlocks = blocks.filter((b) => b.status === "completed").length;
  const runningBlocks = blocks.filter((b) => b.status === "running").length;
  const pendingBlocks = blocks.filter((b) => b.status === "pending" || b.status === "snoozed").length;

  const totalHours = blocks.reduce((acc, b) => acc + (b.duration_hours || 0), 0);
  const completedHours = blocks
    .filter((b) => b.status === "completed")
    .reduce((acc, b) => acc + (b.duration_hours || 0), 0);

  const completionPct = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;

  // Breakdown by category
  const categoryHours: Record<Category, number> = {
    "Deep Work": 0,
    "Learning": 0,
    "Health": 0,
    "Break": 0,
    "Admin": 0,
    "Work": 0,
    "Study": 0,
  };

  blocks.forEach((b) => {
    if (categoryHours[b.category] !== undefined) {
      categoryHours[b.category] += b.duration_hours;
    }
  });

  const exportScheduleJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(blocks, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dincharya-schedule-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Daily Focus Adherence & Analytics
            </h3>
            <p className="text-xs text-zinc-400">
              {completedBlocks} of {totalBlocks} blocks finished ({completedHours.toFixed(1)} / {totalHours.toFixed(1)} hrs)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportScheduleJson}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
            title="Export today's schedule to JSON"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={onResetSeed}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
            title="Reset to default recommended schedule"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Default</span>
          </button>
        </div>

      </div>

      {/* Stats Grid */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Progress % */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Focus Score</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 font-mono text-xl sm:text-2xl font-black text-emerald-400">
            {completionPct}%
          </div>
          <div className="mt-2 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* Deep Work Hours */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Deep Work</span>
            <Flame className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="mt-1 font-mono text-xl sm:text-2xl font-black text-indigo-300">
            {categoryHours["Deep Work"].toFixed(1)}h
          </div>
          <span className="text-[10px] text-zinc-500">Core engineering / coding</span>
        </div>

        {/* Learning / Study Hours */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Learning & DSA</span>
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 font-mono text-xl sm:text-2xl font-black text-emerald-300">
            {(categoryHours["Learning"] + categoryHours["Study"]).toFixed(1)}h
          </div>
          <span className="text-[10px] text-zinc-500">Algorithms & System Design</span>
        </div>

        {/* Health & Breaks */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Health & Rest</span>
            <Clock className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="mt-1 font-mono text-xl sm:text-2xl font-black text-amber-300">
            {(categoryHours["Health"] + categoryHours["Break"]).toFixed(1)}h
          </div>
          <span className="text-[10px] text-zinc-500">Workouts, walks & recovery</span>
        </div>

      </div>
    </div>
  );
}
