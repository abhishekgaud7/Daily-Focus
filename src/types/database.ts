export type Category = 
  | 'Deep Work' 
  | 'Learning' 
  | 'Health' 
  | 'Break' 
  | 'Admin' 
  | 'Work' 
  | 'Study';

export type BlockStatus = 
  | 'pending' 
  | 'running' 
  | 'completed' 
  | 'snoozed' 
  | 'skipped';

export interface DailyBlock {
  id: string;
  user_id?: string;
  task_title: string;
  category: Category;
  task_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm:ss or HH:mm
  duration_hours: number;
  end_time: string; // HH:mm:ss or HH:mm
  status: BlockStatus;
  notes?: string | null;
  ai_suggested?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  timezone: string;
  work_start_hour: number;
  work_end_hour: number;
  sound_enabled: boolean;
  created_at: string;
  updated_at?: string;
}

export interface FocusSessionLog {
  id: string;
  task_id: string;
  user_id: string;
  started_at: string;
  ended_at?: string | null;
  actual_duration_minutes: number;
  created_at?: string;
}

export interface ParsedTaskResult {
  task_title: string;
  category: Category;
  start_time: string; // HH:mm
  duration_hours: number;
  end_time: string; // HH:mm
  notes?: string;
  confidence?: number;
}
