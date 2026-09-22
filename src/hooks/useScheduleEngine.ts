"use client";

import { useState, useEffect, useCallback } from "react";
import { DailyBlock, Profile } from "@/types/database";
import { dbService } from "@/lib/supabase";
import { getTodayDateString, findNextFreeSlot, timeToMinutes, minutesToTime, calculateEndTime } from "@/utils/timeUtils";

export function useScheduleEngine() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [blocks, setBlocks] = useState<DailyBlock[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshBlocks = useCallback(async () => {
    try {
      const data = await dbService.getBlocks(selectedDate);
      setBlocks(data);
    } catch (e) {
      console.error("[useScheduleEngine] Failed to fetch blocks:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    refreshBlocks();
    dbService.getProfile().then(setProfile);
  }, [refreshBlocks]);

  const addBlock = async (newBlockData: Omit<DailyBlock, "id" | "created_at" | "updated_at">) => {
    const created = await dbService.addBlock({
      ...newBlockData,
      task_date: selectedDate,
    });
    await refreshBlocks();
    return created;
  };

  const updateBlock = async (id: string, updates: Partial<DailyBlock>) => {
    const updated = await dbService.updateBlock(id, updates);
    await refreshBlocks();
    return updated;
  };

  const deleteBlock = async (id: string) => {
    await dbService.deleteBlock(id);
    await refreshBlocks();
  };

  /**
   * Reschedules an overdue or missed block to the next available free slot today.
   */
  const rescheduleBlockToNextSlot = async (id: string): Promise<boolean> => {
    const target = blocks.find((b) => b.id === id);
    if (!target) return false;

    const freeSlot = findNextFreeSlot(blocks, target.duration_hours);
    if (!freeSlot) return false;

    await updateBlock(id, {
      start_time: freeSlot.start_time,
      end_time: freeSlot.end_time,
      status: "pending",
      notes: target.notes ? `${target.notes} (Rescheduled)` : "Rescheduled to next free slot",
    });
    return true;
  };

  /**
   * Shifts morning blocks forward by X minutes (e.g. +30 mins)
   */
  const shiftMorningBlocks = async (minutesToAdd: number = 30) => {
    const morningBlocks = blocks.filter((b) => {
      const startMin = timeToMinutes(b.start_time);
      return startMin < 12 * 60 && b.status === "pending"; // morning blocks
    });

    for (const b of morningBlocks) {
      const startMin = timeToMinutes(b.start_time) + minutesToAdd;
      const endMin = timeToMinutes(b.end_time) + minutesToAdd;
      await dbService.updateBlock(b.id, {
        start_time: minutesToTime(startMin),
        end_time: minutesToTime(endMin),
      });
    }

    await refreshBlocks();
  };

  const resetToSeedBlocks = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("dincharya_daily_blocks");
    }
    await refreshBlocks();
  };

  return {
    selectedDate,
    setSelectedDate,
    blocks,
    profile,
    loading,
    refreshBlocks,
    addBlock,
    updateBlock,
    deleteBlock,
    rescheduleBlockToNextSlot,
    shiftMorningBlocks,
    resetToSeedBlocks,
  };
}
