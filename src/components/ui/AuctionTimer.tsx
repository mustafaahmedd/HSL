'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AuctionTimerProps {
  /** When the clock starts (after the buffer) — from AuctionSession.biddingStartTime */
  startTime?: string | Date | null;
  /** When it hits zero — from AuctionSession.biddingEndTime. Missing = no timer for this tier. */
  endTime?: string | Date | null;
  /** serverTime - Date.now() at fetch time, so every screen counts down in sync */
  serverOffsetMs?: number;
  /** Elapsed % at which the buzzer starts (default 75) */
  warningPercent?: number;
  /** Play the buzzer on this screen (admin console). Public screens stay silent by default. */
  sound?: boolean;
  size?: 'md' | 'lg';
}

// Short square-wave beeps through Web Audio; no audio files needed.
let audioCtx: AudioContext | null = null;
const beep = (freq: number, ms: number, volume = 0.15) => {
  try {
    audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + ms / 1000);
  } catch {
    // Audio blocked or unsupported — the visual warning still shows
  }
};

export default function AuctionTimer({
  startTime, endTime, serverOffsetMs = 0, warningPercent = 75, sound = false, size = 'md',
}: AuctionTimerProps) {
  const [now, setNow] = useState(() => Date.now() + serverOffsetMs);
  const [muted, setMuted] = useState(false);
  const lastBeepSecond = useRef<number | null>(null);
  const finished = useRef(false);

  const start = startTime ? new Date(startTime).getTime() : 0;
  const end = endTime ? new Date(endTime).getTime() : 0;

  useEffect(() => {
    try { setMuted(localStorage.getItem('auctionTimerMuted') === '1'); } catch { /* storage unavailable */ }
  }, []);

  useEffect(() => {
    lastBeepSecond.current = null;
    finished.current = false;
  }, [start, end]);

  useEffect(() => {
    if (!end) return;
    const id = setInterval(() => setNow(Date.now() + serverOffsetMs), 200);
    return () => clearInterval(id);
  }, [end, serverOffsetMs]);

  const total = Math.max(1, end - start);
  const elapsed = Math.min(total, Math.max(0, now - start));
  const remainingMs = Math.max(0, end - now);
  const remaining = Math.ceil(remainingMs / 1000);
  const pct = (elapsed / total) * 100;
  const waiting = now < start;
  const done = !!end && remainingMs <= 0;
  const warning = !waiting && !done && pct >= warningPercent;

  // Buzz once per second in the warning zone, long tone at zero
  useEffect(() => {
    if (!sound || muted || !end) return;
    if (done) {
      if (!finished.current) { finished.current = true; beep(440, 900, 0.2); }
      return;
    }
    if (warning && lastBeepSecond.current !== remaining) {
      lastBeepSecond.current = remaining;
      beep(remaining <= 5 ? 1200 : 880, 140);
    }
  }, [sound, muted, end, done, warning, remaining]);

  if (!end) return null;

  const dims = size === 'lg' ? 'w-36 h-36' : 'w-24 h-24';
  const text = size === 'lg' ? 'text-4xl' : 'text-2xl';
  const r = 45;
  const circumference = 2 * Math.PI * r;
  const color = done ? '#dc2626' : warning ? '#ef4444' : pct >= warningPercent * 0.66 ? '#f59e0b' : '#10b981';

  const toggleMute = () => {
    setMuted(m => {
      try { localStorage.setItem('auctionTimerMuted', m ? '0' : '1'); } catch { /* ignore */ }
      return !m;
    });
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative ${dims} ${warning ? 'animate-pulse' : ''}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200/60" />
          <circle
            cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={waiting ? 0 : circumference * (pct / 100)}
            style={{ transition: 'stroke-dashoffset 0.2s linear, stroke 0.3s' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {waiting ? (
            <span className="text-xs font-semibold text-gray-500">Get ready</span>
          ) : done ? (
            <span className={`font-extrabold text-red-600 ${size === 'lg' ? 'text-xl' : 'text-base'}`}>TIME UP</span>
          ) : (
            <span className={`font-extrabold tabular-nums ${text}`} style={{ color }}>{remaining}</span>
          )}
        </div>
      </div>
      {sound && (
        <button
          type="button"
          onClick={toggleMute}
          className="text-xs text-gray-500 hover:text-gray-800 underline-offset-2 hover:underline"
        >
          {muted ? 'Buzzer off — turn on' : 'Buzzer on — mute'}
        </button>
      )}
    </div>
  );
}
