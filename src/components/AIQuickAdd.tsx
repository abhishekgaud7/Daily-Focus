"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, CornerDownLeft, Zap, Info } from "lucide-react";
import { parseTaskNaturalLanguage, parseTaskPromptLocal } from "@/utils/aiParser";
import { DailyBlock } from "@/types/database";
import { formatFriendlyTime, formatDuration } from "@/utils/timeUtils";

interface AIQuickAddProps {
  onAddBlock: (block: Omit<DailyBlock, "id" | "created_at" | "updated_at">) => Promise<unknown>;
  selectedDate: string;
}

const SAMPLE_PROMPTS = [
  "DSA practice from 10am for 2 hours",
  "Gym workout at 6pm for 45 mins",
  "Backend API design at 2pm for 1.5 hrs",
  "Healthy lunch & walk at 1pm for 45m",
];

export function AIQuickAdd({ onAddBlock, selectedDate }: AIQuickAddProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ReturnType<typeof parseTaskPromptLocal> | null>(null);

  const handleInputChange = (val: string) => {
    setPrompt(val);
    if (val.trim().length > 4) {
      const parsed = parseTaskPromptLocal(val);
      setPreview(parsed);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const parsed = await parseTaskNaturalLanguage(prompt.trim());
      await onAddBlock({
        task_title: parsed.task_title,
        category: parsed.category,
        task_date: selectedDate,
        start_time: parsed.start_time,
        duration_hours: parsed.duration_hours,
        end_time: parsed.end_time,
        status: "pending",
        notes: parsed.notes || `Added via Natural Language: "${prompt}"`,
        ai_suggested: false,
      });

      setPrompt("");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset: string) => {
    setPrompt(preset);
    const parsed = parseTaskPromptLocal(preset);
    setPreview(parsed);
  };

  return (
    <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-md shadow-lg shadow-black/40">
      
      {/* Title */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
            AI Natural Language Quick-Add
            <span className="rounded bg-indigo-500/10 px-1.5 py-0.2 text-[10px] text-indigo-300 font-mono border border-indigo-500/20">
              NLP Engine
            </span>
          </h3>
        </div>
        <span className="text-[11px] text-zinc-500 hidden sm:inline">
          Type naturally (e.g. &quot;Leetcode at 10am for 2h&quot;)
        </span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            value={prompt}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder='Try: "DSA practice from 10am for 2 hours" or "Team review at 4pm for 45m"'
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-4 pr-24 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
          />

          <button
            type="submit"
            disabled={!prompt.trim() || loading}
            className="absolute right-1.5 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-40 shadow-sm"
          >
            <span>{loading ? "Parsing..." : "Add"}</span>
            <CornerDownLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Live Parse Preview Badge */}
        {preview && (
          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-950/40 px-3 py-1.5 text-xs text-indigo-200 animate-in fade-in">
            <Zap className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="font-semibold text-white truncate">{preview.task_title}</span>
            <span className="text-zinc-400">•</span>
            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300">
              {preview.category}
            </span>
            <span className="text-zinc-400">•</span>
            <span className="font-mono text-zinc-300">
              {formatFriendlyTime(preview.start_time)} – {formatFriendlyTime(preview.end_time)}
            </span>
            <span className="text-zinc-400">({formatDuration(preview.duration_hours)})</span>
          </div>
        )}

        {/* Quick Example Chips */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-zinc-400">
          <span className="text-zinc-500 shrink-0 font-medium">Suggestions:</span>
          {SAMPLE_PROMPTS.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => handleApplyPreset(sample)}
              className="shrink-0 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>
      </form>

    </div>
  );
}
