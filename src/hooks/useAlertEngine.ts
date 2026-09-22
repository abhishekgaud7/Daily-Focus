"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DailyBlock } from "@/types/database";
import { audioAlert } from "@/utils/audioAlert";
import { dispatchDesktopNotification } from "@/utils/notifications";
import { 
  getCurrentTimeString, 
  getCurrentTimeMinutes, 
  timeToMinutes, 
  minutesToTime,
  calculateEndTime,
  formatDuration 
} from "@/utils/timeUtils";

interface UseAlertEngineProps {
  blocks: DailyBlock[];
  onUpdateBlock: (id: string, updates: Partial<DailyBlock>) => Promise<DailyBlock | null>;
}

export function useAlertEngine({ blocks, onUpdateBlock }: UseAlertEngineProps) {
  const [activeAlertBlock, setActiveAlertBlock] = useState<DailyBlock | null>(null);
  const [preTransitionWarning, setPreTransitionWarning] = useState<{
    block: DailyBlock;
    message: string;
  } | null>(null);

  // Keep track of blocks already alerted to prevent repeated prompts in the same minute
  const alertedStartMap = useRef<Set<string>>(new Set());
  const alertedWarningMap = useRef<Set<string>>(new Set());

  const evaluateAlerts = useCallback(() => {
    const nowTimeStr = getCurrentTimeString(); // "HH:mm"
    const nowMinutes = getCurrentTimeMinutes();

    for (const block of blocks) {
      if (block.status === "skipped" || block.status === "completed") continue;

      const blockStartMin = timeToMinutes(block.start_time);
      const blockEndMin = timeToMinutes(block.end_time);
      const startKey = `${block.id}-${block.start_time}`;
      const warnKey = `${block.id}-warn`;

      // 1. Task Start Alert Condition:
      // Match current minute and not yet alerted
      if (nowMinutes === blockStartMin && !alertedStartMap.current.has(startKey)) {
        if (block.status === "pending" || block.status === "snoozed") {
          alertedStartMap.current.add(startKey);
          setActiveAlertBlock(block);

          // Audio Chime
          audioAlert.playTaskStartChime();

          // Native Desktop Push Notification
          dispatchDesktopNotification(`Time for: ${block.task_title}`, {
            body: `Duration: ${formatDuration(block.duration_hours)} (Ends at ${block.end_time}). Time to focus!`,
            tag: `start-${block.id}`,
            requireInteraction: true,
          });
        }
      }

      // 2. Pre-transition 5-minute warning:
      // For tasks currently running, when 5 minutes remain before end_time
      if (block.status === "running") {
        const remainingMinutes = blockEndMin - nowMinutes;

        if (remainingMinutes > 0 && remainingMinutes <= 5 && !alertedWarningMap.current.has(warnKey)) {
          alertedWarningMap.current.add(warnKey);

          setPreTransitionWarning({
            block,
            message: `5 minutes remaining for "${block.task_title}". Prepare to wrap up!`,
          });

          audioAlert.playPreTransitionChime();

          dispatchDesktopNotification(`5-Minute Warning: ${block.task_title}`, {
            body: `5 minutes remaining in this block. Time to wrap up tasks!`,
            tag: `warn-${block.id}`,
          });
        }
      }
    }
  }, [blocks]);

  // Clean 10-Second Cadence Timer (Protects CPU & Memory)
  useEffect(() => {
    // Initial evaluation on mount
    evaluateAlerts();

    const interval = setInterval(() => {
      evaluateAlerts();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [evaluateAlerts]);

  // Action handlers
  const handleStartFocus = async (block: DailyBlock) => {
    setActiveAlertBlock(null);
    await onUpdateBlock(block.id, { status: "running" });
  };

  const handleSnooze = async (block: DailyBlock, snoozeMinutes: number = 10) => {
    setActiveAlertBlock(null);
    const newStartMin = getCurrentTimeMinutes() + snoozeMinutes;
    const newStartTime = minutesToTime(newStartMin);
    const newEndTime = calculateEndTime(newStartTime, block.duration_hours);

    // Remove old startKey so it can alert again at the new time
    alertedStartMap.current.delete(`${block.id}-${block.start_time}`);

    await onUpdateBlock(block.id, {
      start_time: newStartTime,
      end_time: newEndTime,
      status: "snoozed",
    });
  };

  const handleSkip = async (block: DailyBlock) => {
    setActiveAlertBlock(null);
    await onUpdateBlock(block.id, { status: "skipped" });
  };

  const dismissModal = () => {
    setActiveAlertBlock(null);
  };

  const dismissWarning = () => {
    setPreTransitionWarning(null);
  };

  return {
    activeAlertBlock,
    preTransitionWarning,
    handleStartFocus,
    handleSnooze,
    handleSkip,
    dismissModal,
    dismissWarning,
  };
}
