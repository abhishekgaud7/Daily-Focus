"use client";

import React, { useState } from "react";
import { 
  Laptop, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Cpu, 
  HardDrive,
  Download
} from "lucide-react";

interface StartupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StartupGuideModal({ isOpen, onClose }: StartupGuideModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyStartupCommand = () => {
    navigator.clipboard.writeText("shell:startup");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-sky-500/40 bg-zinc-900 p-6 sm:p-8 shadow-2xl shadow-sky-950/40 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Laptop className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Windows Startup & PWA Auto-Launch Guide
              </h3>
              <p className="text-xs text-zinc-400">
                Configure Dincharya Focus OS to boot seamlessly when you power on your laptop
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="mt-5 space-y-4 text-xs sm:text-sm text-zinc-300">
          
          {/* Step 1 */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <div className="flex items-center gap-2 font-bold text-white mb-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-zinc-950 text-[11px] font-black">
                1
              </span>
              <span>Install Dincharya Focus OS as a Desktop App (PWA)</span>
            </div>
            <p className="text-zinc-400 pl-7 text-xs leading-relaxed">
              In Google Chrome or Microsoft Edge, click the <strong>Install</strong> icon in the address bar (or go to <em>Settings &gt; Cast, save, and share &gt; Install page as app</em>). This creates a dedicated, borderless standalone desktop window.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <div className="flex items-center gap-2 font-bold text-white mb-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-zinc-950 text-[11px] font-black">
                2
              </span>
              <span>Open the Windows Startup Folder</span>
            </div>
            <p className="text-zinc-400 pl-7 text-xs mb-2.5">
              Press <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-200 font-mono">Win + R</kbd> on your keyboard, type or paste the command below, and press <strong>Enter</strong>:
            </p>
            <div className="ml-7 flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2">
              <code className="font-mono text-emerald-400 text-xs">shell:startup</code>
              <button
                onClick={copyStartupCommand}
                className="flex items-center gap-1 text-[11px] font-semibold text-zinc-300 hover:text-white bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-700"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <div className="flex items-center gap-2 font-bold text-white mb-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-zinc-950 text-[11px] font-black">
                3
              </span>
              <span>Place the Shortcut in Startup</span>
            </div>
            <p className="text-zinc-400 pl-7 text-xs leading-relaxed">
              Drag or copy the <strong>&quot;Dincharya Focus OS&quot;</strong> shortcut from your Desktop into the opened <em>Startup</em> folder. That&apos;s it! The app will now automatically launch in standalone focus mode on every system startup.
            </p>
          </div>

          {/* Resource & Hardware Safety Guarantee */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-4">
            <div className="flex items-center gap-2 font-bold text-emerald-400 mb-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Hardware & Battery Protection Guarantee</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300">
              <div className="flex items-start gap-2">
                <Cpu className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>Clean 10s schedule ticker ensures ~0% idle CPU and battery drain.</span>
              </div>
              <div className="flex items-start gap-2">
                <HardDrive className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>Zero SSD thrashing; audio is synthesized purely in RAM on demand.</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-zinc-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-zinc-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-zinc-700 transition-colors"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
}
