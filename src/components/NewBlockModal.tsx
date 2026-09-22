"use client";

import React, { useState, useEffect } from "react";
import { DailyBlock, Category } from "@/types/database";
import { 
  X, 
  Clock, 
  AlertTriangle, 
  Check, 
  Sparkles 
} from "lucide-react";
import { 
  calculateEndTime, 
  detectTimeConflict, 
  formatDuration, 
  formatFriendlyTime, 
  getCurrentTimeString 
} from "@/utils/timeUtils";

interface NewBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blockData: Omit<DailyBlock, "id" | "created_at" | "updated_at">) => Promise<unknown>;
  existingBlocks: DailyBlock[];
  initialStartTime?: string;
  selectedDate: string;
}

const CATEGORIES: Category[] = [
  "Deep Work",
  "Learning",
  "Health",
  "Break",
  "Admin",
  "Work",
  "Study",
];

const PRESET_DURATIONS = [
  { label: "15m", value: 0.25 },
  { label: "30m", value: 0.5 },
  { label: "45m", value: 0.75 },
  { label: "1h", value: 1.0 },
  { label: "1.5h", value: 1.5 },
  { label: "2h", value: 2.0 },
  { label: "3h", value: 3.0 },
];

export function NewBlockModal({
  isOpen,
  onClose,
  onSave,
  existingBlocks,
  initialStartTime,
  selectedDate,
}: NewBlockModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Deep Work");
  const [startTime, setStartTime] = useState(initialStartTime || "10:00");
  const [durationHours, setDurationHours] = useState<number>(1.0);
  const [endTime, setEndTime] = useState("11:00");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialStartTime) {
      setStartTime(initialStartTime);
    }
  }, [initialStartTime]);

  // Recalculate end time whenever startTime or durationHours changes
  useEffect(() => {
    if (startTime && durationHours) {
      setEndTime(calculateEndTime(startTime, durationHours));
    }
  }, [startTime, durationHours]);

  if (!isOpen) return null;

  // Conflict detection
  const conflictCheck = detectTimeConflict(startTime, endTime, existingBlocks);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        task_title: title.trim(),
        category,
        task_date: selectedDate,
        start_time: startTime,
        duration_hours: durationHours,
        end_time: endTime,
        status: "pending",
        notes: notes.trim() || null,
        ai_suggested: false,
      });
      // Reset form
      setTitle("");
      setNotes("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 shadow-2xl shadow-black/80">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Add Daily Focus Block
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Task Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Deep Work: Refactor Auth Service"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium border text-center transition-all ${
                    category === cat
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm"
                      : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Time & Duration Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Time */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* End Time (Calculated) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Calculated End Time
              </label>
              <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-2 text-sm font-mono text-zinc-300">
                {formatFriendlyTime(endTime)} ({endTime})
              </div>
            </div>
          </div>

          {/* Duration Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Duration: {formatDuration(durationHours)}
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_DURATIONS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setDurationHours(preset.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    durationHours === preset.value
                      ? "bg-emerald-500 text-zinc-950 shadow-sm shadow-emerald-500/30"
                      : "border border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conflict Warning */}
          {conflictCheck.hasConflict && conflictCheck.conflictingBlock && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-semibold">Schedule Overlap Detected:</span> Conflicts with &quot;{conflictCheck.conflictingBlock.task_title}&quot; ({formatFriendlyTime(conflictCheck.conflictingBlock.start_time)} – {formatFriendlyTime(conflictCheck.conflictingBlock.end_time)}). You may adjust your start time or duration.
              </div>
            </div>
          )}

          {/* Notes / Details */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Focus Goal / Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Focus specifically on Leetcode 23 and 25"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/30 disabled:opacity-50"
            >
              <Check className="h-4 w-4 stroke-[3]" />
              <span>{isSubmitting ? "Adding..." : "Save Block"}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
