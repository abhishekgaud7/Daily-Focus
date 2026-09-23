"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useScheduleEngine } from "@/hooks/useScheduleEngine";
import { useAlertEngine } from "@/hooks/useAlertEngine";
import { Header } from "@/components/Header";
import { ActiveTaskBanner } from "@/components/ActiveTaskBanner";
import { AIQuickAdd } from "@/components/AIQuickAdd";
import { TimelineView } from "@/components/TimelineView";
import { TaskAlertModal } from "@/components/TaskAlertModal";
import { NewBlockModal } from "@/components/NewBlockModal";
import { DailyKickoffModal } from "@/components/DailyKickoffModal";
import { AIOptimizerModal } from "@/components/AIOptimizerModal";
import { StartupGuideModal } from "@/components/StartupGuideModal";
import { DailyStatsWidget } from "@/components/DailyStatsWidget";
import { DailyBlock } from "@/types/database";
import { 
  getCurrentTimeMinutes, 
  timeToMinutes, 
  getTodayDateString 
} from "@/utils/timeUtils";
import { isSupabaseConfigured } from "@/lib/supabase";
import { 
  AlertTriangle, 
  X, 
  Database, 
  ShieldCheck, 
  CheckCircle,
  Sparkles
} from "lucide-react";

export default function Dashboard() {
  const {
    selectedDate,
    setSelectedDate,
    blocks,
    loading,
    addBlock,
    updateBlock,
    deleteBlock,
    rescheduleBlockToNextSlot,
    shiftMorningBlocks,
    resetToSeedBlocks,
  } = useScheduleEngine();

  // Alert & Chime Engine
  const {
    activeAlertBlock,
    preTransitionWarning,
    handleStartFocus,
    handleSnooze,
    handleSkip,
    dismissModal,
    dismissWarning,
  } = useAlertEngine({
    blocks,
    onUpdateBlock: updateBlock,
  });

  // Modal States
  const [isNewBlockOpen, setIsNewBlockOpen] = useState(false);
  const [newBlockInitialStart, setNewBlockInitialStart] = useState<string>("10:00");
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const [isKickoffOpen, setIsKickoffOpen] = useState(false);
  const [isStartupGuideOpen, setIsStartupGuideOpen] = useState(false);

  // Automatically trigger Daily Kickoff on first open of the day
  useEffect(() => {
    if (typeof window === "undefined") return;
    const today = getTodayDateString();
    const lastSeen = localStorage.getItem("dincharya_kickoff_seen_date");

    if (lastSeen !== today) {
      setIsKickoffOpen(true);
      localStorage.setItem("dincharya_kickoff_seen_date", today);
    }

    // Keyboard Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setNewBlockInitialStart("10:00");
        setIsNewBlockOpen(true);
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        setIsKickoffOpen(true);
      } else if (e.key === "o" || e.key === "O") {
        e.preventDefault();
        setIsOptimizerOpen(true);
      } else if (e.key === "Escape") {
        setIsNewBlockOpen(false);
        setIsOptimizerOpen(false);
        setIsKickoffOpen(false);
        setIsStartupGuideOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute Active/Running Block
  const runningBlock = useMemo(() => {
    return blocks.find((b) => b.status === "running") || null;
  }, [blocks]);

  // Compute Next Upcoming Block
  const upcomingBlock = useMemo(() => {
    const nowMin = getCurrentTimeMinutes();
    const sorted = [...blocks]
      .filter((b) => b.status === "pending" && timeToMinutes(b.start_time) >= nowMin)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    return sorted[0] || null;
  }, [blocks]);

  // Compute Overall Stats
  const totalBlocks = blocks.length;
  const completedBlocks = blocks.filter((b) => b.status === "completed").length;
  const totalHours = blocks.reduce((acc, b) => acc + (b.duration_hours || 0), 0);

  // Handlers
  const handleEmptySlotClick = (hourStr: string) => {
    setNewBlockInitialStart(hourStr);
    setIsNewBlockOpen(true);
  };

  const handleStartBlock = async (block: DailyBlock) => {
    await updateBlock(block.id, { status: "running" });
  };

  const handleCompleteBlock = async (id: string) => {
    await updateBlock(id, { status: "completed" });
  };

  const handleApplyOptimizedBlocks = async (newBlocks: Omit<DailyBlock, "id">[]) => {
    for (const b of newBlocks) {
      await addBlock(b);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30">
      
      {/* Top Navigation & Controls */}
      <Header
        onOpenNewBlock={() => {
          setNewBlockInitialStart("10:00");
          setIsNewBlockOpen(true);
        }}
        onOpenOptimizer={() => setIsOptimizerOpen(true)}
        onOpenKickoff={() => setIsKickoffOpen(true)}
        onOpenStartupGuide={() => setIsStartupGuideOpen(true)}
        onLoadStudyPlan={resetToSeedBlocks}
        totalBlocks={totalBlocks}
        totalHours={totalHours}
        completedBlocks={completedBlocks}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Main Content Area */}
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        
        {/* Supabase Status / Offline Banner */}
        {!isSupabaseConfigured && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-xs text-zinc-400">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Running in <strong className="text-zinc-200">Local-First Offline Persistence Mode</strong>. Full data is saved directly in browser storage.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 hidden md:inline">Connect remote database anytime via .env.local</span>
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-zinc-300">
                PostgreSQL Ready
              </span>
            </div>
          </div>
        )}

        {/* 5-Minute Pre-Transition Warning Toast */}
        {preTransitionWarning && (
          <div className="relative flex items-center justify-between gap-4 rounded-2xl border border-amber-500/40 bg-amber-950/60 p-4 text-xs sm:text-sm text-amber-200 shadow-xl shadow-amber-950/30 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <strong className="font-bold text-white block">Pre-Transition Warning</strong>
                <span>{preTransitionWarning.message}</span>
              </div>
            </div>
            <button
              onClick={dismissWarning}
              className="rounded-lg p-1.5 text-amber-400/80 hover:bg-amber-500/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Active Task Banner / Ongoing Countdown */}
        <ActiveTaskBanner
          runningBlock={runningBlock}
          upcomingBlock={upcomingBlock}
          onUpdateBlock={updateBlock}
          onStartBlock={handleStartBlock}
        />

        {/* AI Natural Language Quick-Add */}
        <AIQuickAdd
          onAddBlock={addBlock}
          selectedDate={selectedDate}
        />

        {/* Hourly Visual Timeline (06:00 – 23:00) */}
        <TimelineView
          blocks={blocks}
          onStartBlock={handleStartBlock}
          onCompleteBlock={handleCompleteBlock}
          onDeleteBlock={deleteBlock}
          onRescheduleBlock={rescheduleBlockToNextSlot}
          onEmptySlotClick={handleEmptySlotClick}
        />

        {/* Focus Adherence & Analytics Summary */}
        <DailyStatsWidget
          blocks={blocks}
          onResetSeed={resetToSeedBlocks}
        />

      </main>

      {/* Footer Info */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-300">Dincharya Focus OS</span>
            <span>•</span>
            <span>Ultra-Lightweight Daily Productivity</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <button 
              onClick={() => setIsStartupGuideOpen(true)}
              className="hover:text-emerald-400 transition-colors"
            >
              OS Startup Setup
            </button>
            <span>•</span>
            <button
              onClick={() => setIsOptimizerOpen(true)}
              className="hover:text-indigo-400 transition-colors"
            >
              AI Day Optimizer
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TaskAlertModal
        block={activeAlertBlock}
        onStartFocus={handleStartFocus}
        onSnooze={handleSnooze}
        onSkip={handleSkip}
        onDismiss={dismissModal}
      />

      <NewBlockModal
        isOpen={isNewBlockOpen}
        onClose={() => setIsNewBlockOpen(false)}
        onSave={addBlock}
        existingBlocks={blocks}
        initialStartTime={newBlockInitialStart}
        selectedDate={selectedDate}
      />

      <DailyKickoffModal
        isOpen={isKickoffOpen}
        onClose={() => setIsKickoffOpen(false)}
        blocks={blocks}
        onShiftMorningBlocks={shiftMorningBlocks}
        onOpenOptimizer={() => {
          setIsKickoffOpen(false);
          setIsOptimizerOpen(true);
        }}
      />

      <AIOptimizerModal
        isOpen={isOptimizerOpen}
        onClose={() => setIsOptimizerOpen(false)}
        existingBlocks={blocks}
        onApplyBlocks={handleApplyOptimizedBlocks}
      />

      <StartupGuideModal
        isOpen={isStartupGuideOpen}
        onClose={() => setIsStartupGuideOpen(false)}
      />

    </div>
  );
}
