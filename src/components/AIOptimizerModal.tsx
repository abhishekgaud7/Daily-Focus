"use client";

import React, { useState } from "react";
import { DailyBlock } from "@/types/database";
import { 
  Sparkles, 
  X, 
  Check, 
  Clock, 
  Coffee, 
  Layers, 
  ArrowRight,
  ListPlus
} from "lucide-react";
import { optimizeScheduleLocal } from "@/utils/aiParser";
import { formatFriendlyTime, formatDuration } from "@/utils/timeUtils";

interface AIOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingBlocks: DailyBlock[];
  onApplyBlocks: (blocks: Omit<DailyBlock, "id">[]) => Promise<void>;
}

export function AIOptimizerModal({
  isOpen,
  onClose,
  existingBlocks,
  onApplyBlocks,
}: AIOptimizerModalProps) {
  const [goalsInput, setGoalsInput] = useState(
    "Deep work on core backend APIs\nPractice 2 Leetcode algorithms\nStrength training workout at gym\nReview PRs and respond to emails"
  );
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<Omit<DailyBlock, "id">[] | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    const lines = goalsInput
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    setIsOptimizing(true);
    try {
      // First try API route if available, otherwise fast local optimizer
      let blocksResult: Omit<DailyBlock, "id">[] | null = null;
      try {
        const res = await fetch("/api/ai/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goals: lines, existingBlocks }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.blocks) && data.blocks.length > 0) {
            blocksResult = data.blocks.map((b: DailyBlock) => ({
              ...b,
              task_date: existingBlocks[0]?.task_date || new Date().toISOString().split("T")[0],
              status: "pending",
              ai_suggested: true,
            }));
          }
        }
      } catch {
        // Fallback
      }

      if (!blocksResult) {
        blocksResult = optimizeScheduleLocal(lines, existingBlocks);
      }

      setGeneratedPlan(blocksResult);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleConfirmAndApply = async () => {
    if (!generatedPlan) return;
    await onApplyBlocks(generatedPlan);
    setGeneratedPlan(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-indigo-500/40 bg-zinc-900 p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                AI &quot;Fill My Day&quot; Schedule Optimizer
              </h3>
              <p className="text-xs text-zinc-400">
                Auto-schedules open slots (08:00 – 22:00) with automatic 15-minute buffer breaks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {!generatedPlan ? (
          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                What are your key goals for today? (One per line)
              </label>
              <textarea
                rows={6}
                value={goalsInput}
                onChange={(e) => setGoalsInput(e.target.value)}
                placeholder="Write your daily intentions here..."
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <Coffee className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Intelligent buffer policy: Deep work sessions &gt; 1.5 hours automatically receive a 15-minute mental rest & hydration break.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isOptimizing || !goalsInput.trim()}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-xs font-bold text-white hover:from-indigo-400 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isOptimizing ? "Optimizing Slots..." : "Generate Optimized Day"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Generated Roadmap ({generatedPlan.length} blocks planned)
              </span>
              <button
                onClick={() => setGeneratedPlan(null)}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline"
              >
                Edit Goals
              </button>
            </div>

            {/* Generated Block Cards */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {generatedPlan.map((block, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {block.task_title}
                        </span>
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300">
                          {block.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {block.notes}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-zinc-200 font-semibold">
                      {formatFriendlyTime(block.start_time)} – {formatFriendlyTime(block.end_time)}
                    </span>
                    <div className="text-[10px] text-zinc-400">
                      {formatDuration(block.duration_hours)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Confirmation Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                onClick={() => setGeneratedPlan(null)}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-800"
              >
                Back
              </button>
              <button
                onClick={handleConfirmAndApply}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
              >
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Apply to Schedule</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
