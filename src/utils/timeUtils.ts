import { DailyBlock } from "@/types/database";

/**
 * Converts a 24-hour time string ("10:30" or "10:30:00") into minutes since midnight.
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0] || "0", 10);
  const minutes = parseInt(parts[1] || "0", 10);
  return hours * 60 + minutes;
}

/**
 * Converts minutes since midnight into "HH:mm" 24-hour string.
 */
export function minutesToTime(totalMinutes: number): string {
  const normalized = Math.max(0, Math.min(24 * 60 - 1, Math.round(totalMinutes)));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Formats "14:30" or "14:30:00" into friendly "2:30 PM".
 */
export function formatFriendlyTime(timeStr: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  let hours = parseInt(parts[0] || "0", 10);
  const minutes = (parts[1] || "00").padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Computes end time from start time and duration in hours.
 */
export function calculateEndTime(startTime: string, durationHours: number): string {
  const startMin = timeToMinutes(startTime);
  const durMin = Math.round(durationHours * 60);
  const endMin = Math.min(23 * 60 + 59, startMin + durMin);
  return minutesToTime(endMin);
}

/**
 * Formats duration into clean human string, e.g. 1.5 -> "1h 30m", 0.75 -> "45m", 2 -> "2 hrs".
 */
export function formatDuration(durationHours: number): string {
  const totalMinutes = Math.round(durationHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours} hr${hours > 1 ? "s" : ""}`;
  } else {
    return `${mins} mins`;
  }
}

/**
 * Gets today's date in local YYYY-MM-DD format.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Gets current local time as "HH:mm".
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Gets current local time in total minutes from midnight.
 */
export function getCurrentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Formats remaining seconds into MM:SS or HH:MM:SS.
 */
export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return "00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Detects whether a proposed time interval conflicts with any existing blocks.
 */
export function detectTimeConflict(
  proposedStart: string,
  proposedEnd: string,
  existingBlocks: DailyBlock[],
  excludeBlockId?: string
): { hasConflict: boolean; conflictingBlock?: DailyBlock } {
  const pStartMin = timeToMinutes(proposedStart);
  const pEndMin = timeToMinutes(proposedEnd);

  for (const block of existingBlocks) {
    if (excludeBlockId && block.id === excludeBlockId) continue;
    if (block.status === "skipped") continue;

    const bStartMin = timeToMinutes(block.start_time);
    const bEndMin = timeToMinutes(block.end_time);

    // Overlap condition: start < otherEnd AND end > otherStart
    if (pStartMin < bEndMin && pEndMin > bStartMin) {
      return { hasConflict: true, conflictingBlock: block };
    }
  }

  return { hasConflict: false };
}

/**
 * Finds the next available unallocated gap of at least durationHours between minHour and maxHour.
 */
export function findNextFreeSlot(
  blocks: DailyBlock[],
  durationHours: number,
  searchStartHour: number = 8,
  searchEndHour: number = 22
): { start_time: string; end_time: string } | null {
  const durMin = Math.round(durationHours * 60);
  const searchStartMin = Math.max(getCurrentTimeMinutes(), searchStartHour * 60);
  const searchEndMin = searchEndHour * 60;

  // Filter out skipped blocks and sort active blocks by start_time
  const activeBlocks = blocks
    .filter((b) => b.status !== "skipped")
    .map((b) => ({
      start: timeToMinutes(b.start_time),
      end: timeToMinutes(b.end_time),
    }))
    .sort((a, b) => a.start - b.start);

  let candidateStart = Math.ceil(searchStartMin / 15) * 15; // align to 15m intervals

  while (candidateStart + durMin <= searchEndMin) {
    const candidateEnd = candidateStart + durMin;
    let conflict = false;

    for (const b of activeBlocks) {
      if (candidateStart < b.end && candidateEnd > b.start) {
        conflict = true;
        // Jump candidate start to end of conflicting block rounded up to 5 mins
        candidateStart = Math.ceil(b.end / 5) * 5;
        break;
      }
    }

    if (!conflict) {
      return {
        start_time: minutesToTime(candidateStart),
        end_time: minutesToTime(candidateEnd),
      };
    }
  }

  return null;
}
