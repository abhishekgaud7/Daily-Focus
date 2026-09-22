import { Category, ParsedTaskResult, DailyBlock } from "@/types/database";
import { 
  timeToMinutes, 
  minutesToTime, 
  calculateEndTime, 
  getCurrentTimeString, 
  findNextFreeSlot 
} from "./timeUtils";

/**
 * Categorizes a task title based on semantic keyword mapping.
 */
export function inferCategory(text: string): Category {
  const lower = text.toLowerCase();

  if (/\b(dsa|leetcode|algorithm|study|learn|course|tutorial|book|read|exam|paper)\b/.test(lower)) {
    return 'Learning';
  }
  if (/\b(gym|workout|exercise|run|running|yoga|stretch|walk|health|meditation|cardio)\b/.test(lower)) {
    return 'Health';
  }
  if (/\b(lunch|dinner|breakfast|coffee|snack|break|nap|relax|chill|rest)\b/.test(lower)) {
    return 'Break';
  }
  if (/\b(email|inbox|meeting|sync|standup|call|admin|review|plan|billing|organize)\b/.test(lower)) {
    return 'Admin';
  }
  if (/\b(code|coding|dev|backend|frontend|api|architecture|feature|system|refactor|design|bug|deploy)\b/.test(lower)) {
    return 'Deep Work';
  }

  return 'Deep Work';
}

/**
 * Ultra-fast, zero-latency client-side NLP parser for Quick-Add prompts.
 * Handles inputs like:
 * - "DSA practice from 10am for 2 hours"
 * - "gym at 6pm for 45 mins"
 * - "study backend APIs from 14:00 to 15:30"
 * - "Quick standup at 11am for 30m"
 */
export function parseTaskPromptLocal(prompt: string): ParsedTaskResult {
  const cleanPrompt = prompt.trim();

  // Default values
  let taskTitle = cleanPrompt;
  let startTime = getCurrentTimeString();
  let durationHours = 1.0;

  // 1. Detect "from X to Y" patterns, e.g. "from 10:00 to 11:30" or "from 2pm to 3:30pm"
  const fromToRegex = /\bfrom\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s+(?:to|-)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i;
  const fromToMatch = cleanPrompt.match(fromToRegex);

  if (fromToMatch) {
    const rawStart = fromToMatch[1];
    const rawEnd = fromToMatch[2];
    const parsedStart = parseTimeToken(rawStart);
    const parsedEnd = parseTimeToken(rawEnd);

    if (parsedStart && parsedEnd) {
      startTime = parsedStart;
      const startMins = timeToMinutes(parsedStart);
      const endMins = timeToMinutes(parsedEnd);
      const diff = endMins > startMins ? endMins - startMins : 60;
      durationHours = Math.round((diff / 60) * 100) / 100;
      taskTitle = cleanPrompt.replace(fromToMatch[0], "").trim();
    }
  } else {
    // 2. Detect start time token: "at 10am", "at 6:30 pm", "from 11:00", or "@ 2pm"
    const atRegex = /\b(?:at|@|from)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i;
    const atMatch = cleanPrompt.match(atRegex);

    if (atMatch) {
      const parsedTime = parseTimeToken(atMatch[1]);
      if (parsedTime) {
        startTime = parsedTime;
        taskTitle = cleanPrompt.replace(atMatch[0], "").trim();
      }
    }

    // 3. Detect duration token: "for 2 hours", "for 45 mins", "for 1.5 hrs", "for 90 min"
    const forRegex = /\bfor\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|mins?|minutes?|m)\b/i;
    const forMatch = taskTitle.match(forRegex);

    if (forMatch) {
      const val = parseFloat(forMatch[1]);
      const unit = forMatch[2].toLowerCase();

      if (unit.startsWith("m")) {
        durationHours = Math.round((val / 60) * 100) / 100;
      } else {
        durationHours = val;
      }
      taskTitle = taskTitle.replace(forMatch[0], "").trim();
    }
  }

  // Clean up any stray prepositions or punctuation in title
  taskTitle = taskTitle
    .replace(/\s{2,}/g, " ")
    .replace(/^[-:,.\s]+|[-:,.\s]+$/g, "");

  if (!taskTitle) {
    taskTitle = "Focus Block";
  }

  const category = inferCategory(taskTitle);
  const endTime = calculateEndTime(startTime, durationHours);

  return {
    task_title: taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1),
    category,
    start_time: startTime,
    duration_hours: durationHours,
    end_time: endTime,
    confidence: 0.95,
  };
}

/**
 * Converts time tokens like "10am", "6:30pm", "14:00", "9" into "HH:mm" (24h).
 */
function parseTimeToken(token: string): string | null {
  token = token.toLowerCase().trim();
  const isPM = token.includes("pm");
  const isAM = token.includes("am");
  const rawClean = token.replace(/(am|pm)/g, "").trim();

  const parts = rawClean.split(":");
  let hour = parseInt(parts[0], 10);
  const min = parts[1] ? parseInt(parts[1], 10) : 0;

  if (isNaN(hour) || isNaN(min) || min < 0 || min >= 60) return null;

  if (isPM && hour < 12) {
    hour += 12;
  } else if (isAM && hour === 12) {
    hour = 0;
  }

  if (hour < 0 || hour > 23) return null;

  return `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
}

/**
 * Hybrid Parser: Tries LLM backend API route if configured, falls back to instant local parser.
 */
export async function parseTaskNaturalLanguage(prompt: string): Promise<ParsedTaskResult> {
  try {
    const res = await fetch("/api/ai/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.task_title) {
        return data as ParsedTaskResult;
      }
    }
  } catch {
    // Graceful fallback to client-side heuristic parser
  }

  return parseTaskPromptLocal(prompt);
}

/**
 * Smart "Fill My Day" Optimizer algorithm
 * Distributes user goals into open schedule slots with automated 15-minute breaks.
 */
export function optimizeScheduleLocal(
  rawGoals: string[],
  existingBlocks: DailyBlock[],
  workStartHour: number = 9,
  workEndHour: number = 21
): Omit<DailyBlock, "id">[] {
  const generatedBlocks: Omit<DailyBlock, "id">[] = [];
  let combinedBlocks = [...existingBlocks];

  for (const goal of rawGoals) {
    const trimmed = goal.trim();
    if (!trimmed) continue;

    // Estimate duration: Deep work/coding -> 1.5h - 2h, Gym -> 1h, sync -> 0.5h
    const cat = inferCategory(trimmed);
    let dur = 1.0;
    if (cat === 'Deep Work' || cat === 'Learning') {
      dur = 1.5;
    } else if (cat === 'Break' || cat === 'Admin') {
      dur = 0.5;
    } else if (cat === 'Health') {
      dur = 1.0;
    }

    const freeSlot = findNextFreeSlot(combinedBlocks, dur, workStartHour, workEndHour);

    if (freeSlot) {
      const newBlock: Omit<DailyBlock, "id"> = {
        task_title: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
        category: cat,
        task_date: existingBlocks[0]?.task_date || new Date().toISOString().split("T")[0],
        start_time: freeSlot.start_time,
        duration_hours: dur,
        end_time: freeSlot.end_time,
        status: "pending",
        notes: "Auto-scheduled by AI Day Optimizer",
        ai_suggested: true,
      };

      generatedBlocks.push(newBlock);
      combinedBlocks.push({ ...newBlock, id: `tmp-${Math.random()}` });

      // Automatically add a 15-min buffer break after 1.5h+ deep work blocks
      if (dur >= 1.5) {
        const breakSlot = findNextFreeSlot(combinedBlocks, 0.25, workStartHour, workEndHour);
        if (breakSlot) {
          const bufferBlock: Omit<DailyBlock, "id"> = {
            task_title: "Focus Reset & Hydration Break",
            category: "Break",
            task_date: newBlock.task_date,
            start_time: breakSlot.start_time,
            duration_hours: 0.25,
            end_time: breakSlot.end_time,
            status: "pending",
            notes: "15-minute mental rest & posture reset",
            ai_suggested: true,
          };
          generatedBlocks.push(bufferBlock);
          combinedBlocks.push({ ...bufferBlock, id: `tmp-break-${Math.random()}` });
        }
      }
    }
  }

  return generatedBlocks;
}
