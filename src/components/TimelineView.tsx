"use client";

import React, { useState, useEffect } from "react";
import { DailyBlock, Category } from "@/types/database";
import { 
  timeToMinutes, 
  getCurrentTimeMinutes, 
  formatFriendlyTime, 
  formatDuration 
} from "@/utils/timeUtils";
import { 
  Play, 
  CheckCircle2, 
  Trash2, 
  RotateCw, 
  Sparkles, 
  Clock, 
  MoreVertical,
  Plus
} from "lucide-react";

interface TimelineViewProps {
  blocks: DailyBlock[];
  onStartBlock: (block: DailyBlock) => Promise<void>;
  onCompleteBlock: (id: string) => Promise<void>;
  onDeleteBlock: (id: string) => Promise<void>;
  onRescheduleBlock: (id: string) => Promise<boolean>;
  onEmptySlotClick: (timeStr: string) => void;
}

const START_HOUR = 6; // 06:00
const END_HOUR = 23; // 23:00
const HOUR_HEIGHT = 88; // pixels per 1 hour slot

export function TimelineView({
  blocks,
  onStartBlock,
  onCompleteBlock,
  onDeleteBlock,
  onRescheduleBlock,
  onEmptySlotClick,
}: TimelineViewProps) {
  const [currentMinutes, setCurrentMinutes] = useState<number>(0);

  // Update current time position every 10 seconds
  useEffect(() => {
    setCurrentMinutes(getCurrentTimeMinutes());
    const interval = setInterval(() => {
      setCurrentMinutes(getCurrentTimeMinutes());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalHours = END_HOUR - START_HOUR + 1;
  const totalHeight = totalHours * HOUR_HEIGHT;

  // Calculate live indicator line position
  const liveIndicatorTop = ((currentMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const isIndicatorVisible = liveIndicatorTop >= 0 && liveIndicatorTop <= totalHeight;

  // Color mappings per category
  const getCategoryTheme = (category: Category) => {
    switch (category) {
      case "Deep Work":
        return {
          bg: "bg-indigo-950/70 hover:bg-indigo-950/90",
          border: "border-indigo-500/50",
          badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
          glow: "shadow-indigo-900/20",
        };
      case "Learning":
      case "Study":
        return {
          bg: "bg-emerald-950/70 hover:bg-emerald-950/90",
          border: "border-emerald-500/50",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
          glow: "shadow-emerald-900/20",
        };
      case "Health":
        return {
          bg: "bg-amber-950/70 hover:bg-amber-950/90",
          border: "border-amber-500/50",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
          glow: "shadow-amber-900/20",
        };
      case "Break":
        return {
          bg: "bg-cyan-950/70 hover:bg-cyan-950/90",
          border: "border-cyan-500/50",
          badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
          glow: "shadow-cyan-900/20",
        };
      case "Admin":
      default:
        return {
          bg: "bg-zinc-900/80 hover:bg-zinc-900",
          border: "border-zinc-700/60",
          badge: "bg-zinc-800 text-zinc-300 border-zinc-700",
          glow: "shadow-zinc-900/20",
        };
    }
  };

  return (
    <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-6 backdrop-blur-sm shadow-xl">
      
      {/* Header Info */}
      <div className="mb-4 flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold tracking-wide text-zinc-200 uppercase">
            Hourly Schedule Canvas (06:00 – 23:00)
          </h3>
        </div>
        <span className="text-xs text-zinc-500">
          Click any empty row to schedule a block
        </span>
      </div>

      {/* Main Timeline Canvas */}
      <div 
        className="relative flex select-none overflow-x-hidden"
        style={{ height: `${totalHeight}px` }}
      >
        {/* Left Hour Axis */}
        <div className="w-16 sm:w-20 shrink-0 border-r border-zinc-800/80 pr-3">
          {Array.from({ length: totalHours }).map((_, index) => {
            const hour = START_HOUR + index;
            const timeString = `${hour.toString().padStart(2, "0")}:00`;
            return (
              <div
                key={hour}
                className="relative flex items-start justify-end text-xs font-mono text-zinc-500"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className="-translate-y-2.5 font-medium">{formatFriendlyTime(timeString)}</span>
              </div>
            );
          })}
        </div>

        {/* Right Slots & Block Canvas */}
        <div className="relative flex-1 pl-3 sm:pl-4">
          
          {/* Background Grid Lines & Empty Slot Click Targets */}
          {Array.from({ length: totalHours }).map((_, index) => {
            const hour = START_HOUR + index;
            const hourStr = `${hour.toString().padStart(2, "0")}:00`;
            return (
              <div
                key={hour}
                onClick={() => onEmptySlotClick(hourStr)}
                className="group relative flex border-b border-zinc-800/50 hover:bg-emerald-500/[0.03] transition-colors cursor-pointer"
                style={{ height: `${HOUR_HEIGHT}px` }}
                title={`Click to schedule a block at ${formatFriendlyTime(hourStr)}`}
              >
                {/* 30-min dashed subdivider */}
                <div className="absolute left-0 right-0 top-1/2 border-b border-dashed border-zinc-800/30 pointer-events-none" />
                
                <span className="hidden group-hover:flex absolute right-4 top-2 items-center gap-1 text-[11px] font-medium text-emerald-400/80 bg-zinc-900/90 px-2 py-0.5 rounded border border-emerald-500/20">
                  <Plus className="h-3 w-3" /> Add at {formatFriendlyTime(hourStr)}
                </span>
              </div>
            );
          })}

          {/* Live Current Time Red Indicator Line */}
          {isIndicatorVisible && (
            <div
              className="absolute left-0 right-0 z-20 flex items-center pointer-events-none transition-all duration-1000"
              style={{ top: `${liveIndicatorTop}px` }}
            >
              <div className="flex items-center -ml-2 sm:-ml-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <span className="ml-1.5 rounded bg-red-500/90 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white shadow-sm shadow-red-500/50">
                  NOW
                </span>
              </div>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-red-500 via-red-500/60 to-transparent ml-2 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            </div>
          )}

          {/* Render Allocated Daily Blocks */}
          {blocks.map((block) => {
            const startMin = timeToMinutes(block.start_time);
            const endMin = timeToMinutes(block.end_time);
            
            // Check if block is inside timeline bounds
            const offsetMin = startMin - START_HOUR * 60;
            const durMin = Math.max(15, endMin - startMin);

            const top = (offsetMin / 60) * HOUR_HEIGHT;
            const height = Math.max(42, (durMin / 60) * HOUR_HEIGHT - 6);

            const theme = getCategoryTheme(block.category);
            const isRunning = block.status === "running";
            const isCompleted = block.status === "completed";
            const isSkipped = block.status === "skipped";

            return (
              <div
                key={block.id}
                className={`group absolute left-3 right-3 sm:left-4 sm:right-6 z-10 flex flex-col justify-between rounded-xl border p-2.5 sm:p-3 transition-all shadow-md backdrop-blur-sm ${
                  theme.bg
                } ${theme.border} ${theme.glow} ${
                  isRunning 
                    ? "ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20 animate-[pulse_4s_infinite]" 
                    : ""
                } ${
                  isCompleted 
                    ? "opacity-60 bg-zinc-900/50 border-zinc-800" 
                    : ""
                } ${
                  isSkipped 
                    ? "opacity-40 line-through border-zinc-800 bg-zinc-950/40" 
                    : ""
                }`}
                style={{
                  top: `${Math.max(0, top)}px`,
                  height: `${height}px`,
                }}
              >
                {/* Block Header */}
                <div className="flex items-start justify-between gap-2 overflow-hidden">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${theme.badge}`}>
                        {block.category}
                      </span>
                      {block.ai_suggested && (
                        <span className="flex items-center gap-0.5 rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-medium text-indigo-300 border border-indigo-500/30">
                          <Sparkles className="h-2.5 w-2.5" /> AI
                        </span>
                      )}
                      {isRunning && (
                        <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-zinc-950 animate-pulse">
                          RUNNING
                        </span>
                      )}
                      {isCompleted && (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">
                          DONE
                        </span>
                      )}
                    </div>

                    <h4 className="mt-1 truncate text-xs sm:text-sm font-bold text-white tracking-tight">
                      {block.task_title}
                    </h4>

                    {block.notes && height > 60 && (
                      <p className="mt-0.5 truncate text-[11px] text-zinc-400">
                        {block.notes}
                      </p>
                    )}
                  </div>

                  {/* Top Right Range */}
                  <div className="text-right shrink-0">
                    <span className="font-mono text-[11px] font-medium text-zinc-300">
                      {formatFriendlyTime(block.start_time)} – {formatFriendlyTime(block.end_time)}
                    </span>
                    <div className="text-[10px] text-zinc-400">
                      {formatDuration(block.duration_hours)}
                    </div>
                  </div>
                </div>

                {/* Block Footer Actions (Visible on hover or mobile) */}
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  {!isCompleted && !isRunning && block.status !== "skipped" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartBlock(block);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500 hover:text-zinc-950 transition-colors"
                      title="Start Focus Mode"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Start</span>
                    </button>
                  )}

                  {isRunning && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCompleteBlock(block.id);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-zinc-950 hover:bg-emerald-400 transition-colors shadow-sm"
                    >
                      <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />
                      <span>Finish</span>
                    </button>
                  )}

                  {isSkipped && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await onRescheduleBlock(block.id);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-indigo-500/20 border border-indigo-500/40 px-2 py-1 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-500 hover:text-white transition-colors"
                      title="AI finds the next available free gap today"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Shift to Free Slot</span>
                    </button>
                  )}

                  {!isRunning && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBlock(block.id);
                      }}
                      className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition-colors"
                      title="Delete block"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

              </div>
            );
          })}

        </div>

      </div>

    </div>
  );
}
