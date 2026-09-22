# ⚡ Dincharya Focus OS — Smart Daily Time-Blocker & Alert OS

> **Ultra-lightweight, hardware-protective daily focus and hourly time-blocking operating system.**  
> Built with Next.js (App Router), Tailwind CSS, Supabase, Web Audio API, and Desktop PWA capabilities.

---

## 🌟 Key Highlights

- **Visual Hourly Timeline (06:00 to 23:00)**: Proportional duration scaling, color-coded categories (Deep Work, Learning, Health, Break, Admin), and a live pulsating crimson time indicator.
- **Hardware & Battery Protection**:
  - **Zero CPU/RAM Thrashing**: Real-time schedule evaluation operates on a clean **10-second cadence**.
  - **Synthesized Melodic Chime**: Audio context is generated on-the-fly via the **Web Audio API** using dual sine wave oscillators (C5 -> G5) and is immediately terminated and garbage-collected to prevent memory leaks and background audio threads.
  - **Zero Heavy Polling**: Uses minimal local state and persistent storage.
- **Active Task Banner**: Sticky focus bar with a live **1-second countdown timer**, dynamic progress bar (0% - 100%), pause/resume, +10m extension, and completion confetti.
- **Real-Time Alert Engine**:
  - Assertive in-app transition modal at task start time with `[Start Focus Mode]`, `[Snooze 10m]`, and `[Skip]`.
  - Native HTML5 OS Desktop Notifications for background alert delivery.
  - 5-minute pre-transition warning chime and banner to wrap up sessions cleanly.
- **AI-Powered Productivity**:
  - **Natural Language Quick-Add (NLP Task Parser)**: Converts natural prompts like *"DSA practice from 10am for 2 hours"* or *"Gym at 6pm for 45 mins"* into structured blocks.
  - **"Fill My Day" Optimizer**: Analyzes available unallocated gaps between 08:00 and 22:00, schedules user goals, and automatically injects 15-minute mental reset buffer breaks after deep focus sessions.
  - **Overdue Task Rescheduler**: One-click AI re-allocation moves delayed or missed tasks to the next free window.
- **Progressive Web App (PWA) & Windows Auto-Startup**:
  - Standalone desktop borderless window with offline caching.
  - Built-in guide for placing the shortcut into Windows `shell:startup` for automatic launch upon laptop boot.
- **Supabase PostgreSQL & Dual-Mode Persistence**:
  - Works out-of-the-box in local offline mode without mandatory credentials.
  - Fully integrated with Supabase with comprehensive Row Level Security (RLS) policies.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🗄️ Database Setup (Supabase)

To connect your Supabase database:
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Set your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   GEMINI_API_KEY=your-gemini-key # Optional for cloud AI
   ```
3. Run the SQL migration script located at `supabase/schema.sql` in your Supabase SQL Editor.

---

## 🖥️ Windows Startup Setup (Auto-Launch on Boot)

1. Open the web app in Chrome or Edge and click the **Install** icon in the address bar.
2. Press `Win + R`, type:
   ```cmd
   shell:startup
   ```
   and press **Enter**.
3. Drag or copy the installed desktop shortcut for **"Dincharya Focus OS"** into the opened `Startup` folder.
4. The app will now automatically open in standalone focus mode every time your laptop powers on!
