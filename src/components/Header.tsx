"use client";

import React, { useState, useEffect } from "react";
import { 
  Volume2, 
  VolumeX, 
  Bell, 
  BellRing, 
  Plus, 
  Sparkles, 
  Sunrise, 
  Laptop, 
  Calendar, 
  CheckCircle2,
  Clock
} from "lucide-react";
import { audioAlert } from "@/utils/audioAlert";
import { 
  requestNotificationPermission, 
  getNotificationPermission, 
  isNotificationSupported 
} from "@/utils/notifications";
import { formatFriendlyTime, getCurrentTimeString } from "@/utils/timeUtils";

interface HeaderProps {
  onOpenNewBlock: () => void;
  onOpenOptimizer: () => void;
  onOpenKickoff: () => void;
  onOpenStartupGuide: () => void;
  onLoadStudyPlan?: () => void;
  totalBlocks: number;
  totalHours: number;
  completedBlocks: number;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function Header({
  onOpenNewBlock,
  onOpenOptimizer,
  onOpenKickoff,
  onOpenStartupGuide,
  onLoadStudyPlan,
  totalBlocks,
  totalHours,
  completedBlocks,
  selectedDate,
  onDateChange,
}: HeaderProps) {
  const [muted, setMuted] = useState<boolean>(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    setMuted(audioAlert.getMuted());
    if (isNotificationSupported()) {
      setNotifPermission(getNotificationPermission());
    }

    setCurrentTime(getCurrentTimeString());
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    audioAlert.setMuted(nextMuted);
    if (!nextMuted) {
      audioAlert.playTaskStartChime();
    }
  };

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === "granted") {
      audioAlert.playTaskStartChime();
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        
        {/* Brand & Live Clock */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-zinc-950 shadow-lg shadow-emerald-500/20">
            <Clock className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                Dincharya <span className="text-emerald-400 font-mono text-sm tracking-wider">FOCUS OS</span>
              </h1>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live 10s Engine
              </span>
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-2">
              <span className="font-mono text-zinc-300 font-medium">{formatFriendlyTime(currentTime)}</span>
              <span>•</span>
              <span>{completedBlocks}/{totalBlocks} Done ({totalHours.toFixed(1)} hrs total)</span>
            </p>
          </div>
        </div>

        {/* Date Selector & Global Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-300">
            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 outline-none cursor-pointer"
            />
          </div>

          {/* Sound Mute/Test Toggle */}
          <button
            onClick={toggleSound}
            title={muted ? "Sound muted (click to unmute)" : "Sound enabled (click to mute / test chime)"}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              muted 
                ? "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:text-zinc-300" 
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
            }`}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{muted ? "Muted" : "Chime ON"}</span>
          </button>

          {/* Notification Permission Toggle */}
          {notifPermission !== "granted" ? (
            <button
              onClick={handleEnableNotifications}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors animate-pulse"
              title="Click to enable native desktop notifications"
            >
              <BellRing className="h-3.5 w-3.5" />
              <span>Enable Alerts</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-2.5 py-1.5 text-xs text-zinc-400" title="Desktop notifications active">
              <Bell className="h-3.5 w-3.5 text-emerald-400" />
              <span>Push ON</span>
            </div>
          )}

          {/* Morning Kickoff Modal Trigger */}
          <button
            onClick={onOpenKickoff}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors"
            title="Open Morning Briefing"
          >
            <Sunrise className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">Briefing</span>
          </button>

          {/* AI Day Optimizer Trigger */}
          <button
            onClick={onOpenOptimizer}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all shadow-sm shadow-indigo-500/10"
            title="Auto-block your day using AI"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>AI Auto-Block</span>
          </button>

          {/* Windows Startup Guide */}
          <button
            onClick={onOpenStartupGuide}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            title="How to auto-launch on Windows boot"
          >
            <Laptop className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden lg:inline">OS Startup</span>
          </button>

          {/* 10h Study Plan Preset Trigger */}
          {onLoadStudyPlan && (
            <button
              onClick={onLoadStudyPlan}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500 hover:text-zinc-950 transition-all shadow-sm"
              title="Apply 10-Hour Intensive Study Roadmap: Sigma Web Dev + Java Full Stack + Database + Communication"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>10h Study Plan</span>
            </button>
          )}

          {/* Add New Block Button */}
          <button
            onClick={onOpenNewBlock}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 active:scale-95 transition-all shadow-md shadow-emerald-500/20"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span>Add Block</span>
          </button>

        </div>
      </div>
    </header>
  );
}
