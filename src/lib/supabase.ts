import { createClient } from "@supabase/supabase-js";
import { DailyBlock, Profile, FocusSessionLog, Category } from "@/types/database";
import { getTodayDateString } from "@/utils/timeUtils";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes("your-project-id") &&
  supabaseUrl.startsWith("http")
);

// Create the real Supabase client (or a dummy client if unconfigured)
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : "https://placeholder-dincharya.supabase.co",
  isSupabaseConfigured ? supabaseAnonKey : "placeholder-anon-key"
);

// Default initial realistic blocks for today if local storage is empty
function getDefaultSeedBlocks(): DailyBlock[] {
  const today = getTodayDateString();
  return [
    {
      id: "seed-1",
      task_title: "Morning Routine & Daily Planning",
      category: "Health",
      task_date: today,
      start_time: "07:30",
      duration_hours: 1.0,
      end_time: "08:30",
      status: "completed",
      notes: "Hydrate, light stretching, review today's top 3 outcomes",
      ai_suggested: false,
    },
    {
      id: "seed-2",
      task_title: "Deep Work: High-Priority Engineering",
      category: "Deep Work",
      task_date: today,
      start_time: "09:00",
      duration_hours: 2.5,
      end_time: "11:30",
      status: "pending",
      notes: "Deep coding sprint. Put phone on DND.",
      ai_suggested: false,
    },
    {
      id: "seed-3",
      task_title: "Healthy Lunch & Sunlight Walk",
      category: "Break",
      task_date: today,
      start_time: "12:00",
      duration_hours: 1.0,
      end_time: "13:00",
      status: "pending",
      notes: "Nutritious meal and outdoor walk without screens",
      ai_suggested: false,
    },
    {
      id: "seed-4",
      task_title: "Algorithms & System Design Mastery",
      category: "Learning",
      task_date: today,
      start_time: "14:00",
      duration_hours: 2.0,
      end_time: "16:00",
      status: "pending",
      notes: "Solve 2 Leetcode problems and study distributed caching",
      ai_suggested: false,
    },
    {
      id: "seed-5",
      task_title: "Team Sync & Code Reviews",
      category: "Admin",
      task_date: today,
      start_time: "16:30",
      duration_hours: 1.0,
      end_time: "17:30",
      status: "pending",
      notes: "Clear open PRs and align on sprint delivery",
      ai_suggested: false,
    },
    {
      id: "seed-6",
      task_title: "Evening Workout & Cardio",
      category: "Health",
      task_date: today,
      start_time: "18:00",
      duration_hours: 1.25,
      end_time: "19:15",
      status: "pending",
      notes: "Strength training + 15 min cool down stretching",
      ai_suggested: false,
    },
    {
      id: "seed-7",
      task_title: "Daily Reflection & Wind-Down",
      category: "Admin",
      task_date: today,
      start_time: "21:30",
      duration_hours: 0.75,
      end_time: "22:15",
      status: "pending",
      notes: "Journal accomplishments, prepare schedule for tomorrow",
      ai_suggested: true,
    },
  ];
}

const LOCAL_STORAGE_BLOCKS_KEY = "dincharya_daily_blocks";
const LOCAL_STORAGE_PROFILE_KEY = "dincharya_user_profile";
const LOCAL_STORAGE_LOGS_KEY = "dincharya_focus_logs";

function getLocalBlocks(): DailyBlock[] {
  if (typeof window === "undefined") return getDefaultSeedBlocks();
  const raw = localStorage.getItem(LOCAL_STORAGE_BLOCKS_KEY);
  if (!raw) {
    const initial = getDefaultSeedBlocks();
    localStorage.setItem(LOCAL_STORAGE_BLOCKS_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return getDefaultSeedBlocks();
  }
}

function saveLocalBlocks(blocks: DailyBlock[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_BLOCKS_KEY, JSON.stringify(blocks));
}

// ==========================================================
// Database Operations Service (Hybrid Supabase & Local Fallback)
// ==========================================================

export const dbService = {
  async getBlocks(dateStr: string): Promise<DailyBlock[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("daily_blocks")
          .select("*")
          .eq("task_date", dateStr)
          .order("start_time", { ascending: true });

        if (!error && data) {
          return data as DailyBlock[];
        }
        console.warn("[Supabase] Query error, falling back to local store:", error?.message);
      } catch (e) {
        console.warn("[Supabase] Network error, falling back:", e);
      }
    }

    // Local Storage fallback
    const all = getLocalBlocks();
    // Return blocks matching dateStr or if it's the seed dataset
    return all.filter((b) => b.task_date === dateStr || !b.task_date);
  },

  async addBlock(block: Omit<DailyBlock, "id" | "created_at" | "updated_at">): Promise<DailyBlock> {
    const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `blk-${Date.now()}`;
    const newBlock: DailyBlock = {
      ...block,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("daily_blocks")
          .insert([block])
          .select()
          .single();

        if (!error && data) {
          return data as DailyBlock;
        }
        console.warn("[Supabase] Insert failed, storing locally:", error?.message);
      } catch (e) {
        console.warn("[Supabase] Insert network error:", e);
      }
    }

    const current = getLocalBlocks();
    const updated = [...current, newBlock].sort((a, b) => a.start_time.localeCompare(b.start_time));
    saveLocalBlocks(updated);
    return newBlock;
  },

  async updateBlock(id: string, updates: Partial<DailyBlock>): Promise<DailyBlock | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("daily_blocks")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (!error && data) {
          return data as DailyBlock;
        }
      } catch (e) {
        console.warn("[Supabase] Update network error:", e);
      }
    }

    const current = getLocalBlocks();
    let updatedBlock: DailyBlock | null = null;
    const next = current.map((b) => {
      if (b.id === id) {
        updatedBlock = { ...b, ...updates, updated_at: new Date().toISOString() };
        return updatedBlock;
      }
      return b;
    });
    saveLocalBlocks(next);
    return updatedBlock;
  },

  async deleteBlock(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from("daily_blocks").delete().eq("id", id);
        if (!error) return true;
      } catch (e) {
        console.warn("[Supabase] Delete error:", e);
      }
    }

    const current = getLocalBlocks();
    const next = current.filter((b) => b.id !== id);
    saveLocalBlocks(next);
    return true;
  },

  async logFocusSession(log: Omit<FocusSessionLog, "id" | "created_at">): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from("focus_sessions_log").insert([log]);
        return;
      } catch {
        // Fallback to local
      }
    }

    if (typeof window !== "undefined") {
      const logsRaw = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
      const logs = logsRaw ? JSON.parse(logsRaw) : [];
      logs.push({
        ...log,
        id: `log-${Date.now()}`,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(logs));
    }
  },

  async getProfile(): Promise<Profile> {
    const defaultProfile: Profile = {
      id: "default-user",
      full_name: "Focus Achiever",
      timezone: "Asia/Kolkata",
      work_start_hour: 8,
      work_end_hour: 22,
      sound_enabled: true,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase.from("profiles").select("*").limit(1).single();
        if (data) return data as Profile;
      } catch {
        // Ignore
      }
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // Ignore
        }
      }
    }

    return defaultProfile;
  },

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    const current = await this.getProfile();
    const updated = { ...current, ...updates, updated_at: new Date().toISOString() };

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from("profiles").upsert(updated);
      } catch {
        // Ignore
      }
    }

    return updated;
  },
};
