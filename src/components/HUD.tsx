/**
 * HUD.tsx — Stats bar with 3-heart lives system, level badge,
 * win overlay (with Next Level button), and game-over overlay.
 */

import React, { useEffect, useRef, useState } from "react";
import type { GamePhase } from "../types/game";
import { MAX_LIVES } from "../types/game";

// ─── Props ────────────────────────────────────────────────────────────────────

interface HUDProps {
  levelName: string;
  levelId: number;
  moves: number;
  elapsedSeconds: number;
  trainsRemaining: number;
  lives: number;
  phase: GamePhase;
  isLastLevel: boolean;
  onReset: () => void;
  onNextLevel: () => void;
}

// ─── HUD root ─────────────────────────────────────────────────────────────────

export const HUD: React.FC<HUDProps> = ({
  levelName, levelId, moves, elapsedSeconds, trainsRemaining,
  lives, phase, isLastLevel, onReset, onNextLevel,
}) => {
  const timeLabel = formatTime(elapsedSeconds);

  return (
    <>
      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between w-full max-w-[560px] mx-auto mb-3 px-2 gap-2">

        {/* Level badge */}
        <div className="flex flex-col items-start min-w-[80px]">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">Level</span>
          <span className="text-white font-bold text-xs leading-tight line-clamp-1">{levelName}</span>
        </div>

        {/* Hearts — 3 lives */}
        <HeartsDisplay lives={lives} />

        {/* Moves */}
        <StatBadge label="Moves" value={String(moves)} />

        {/* Time */}
        <StatBadge label="Time" value={timeLabel} />

        {/* Trains left */}
        <StatBadge label="Left" value={String(trainsRemaining)} />

        {/* Reset */}
        <button
          onClick={onReset}
          className="
            px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider
            bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white
            rounded-lg border border-slate-600 hover:border-slate-500
            transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
          "
          aria-label="Restart level"
        >
          ↺
        </button>
      </div>

      {/* ── Overlays ──────────────────────────────────────────────────────── */}
      {phase === "won" && (
        <WinOverlay
          moves={moves}
          timeLabel={timeLabel}
          levelId={levelId}
          isLastLevel={isLastLevel}
          onReset={onReset}
          onNextLevel={onNextLevel}
        />
      )}
      {phase === "game-over" && (
        <GameOverOverlay onReset={onReset} />
      )}
    </>
  );
};

HUD.displayName = "HUD";

// ─── Hearts display ───────────────────────────────────────────────────────────

const HeartsDisplay: React.FC<{ lives: number }> = ({ lives }) => {
  // Shake hearts container briefly whenever a life is lost.
  const [shaking, setShaking] = useState(false);
  const prevLives = useRef(lives);

  useEffect(() => {
    if (lives < prevLives.current && lives >= 0) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 600);
      prevLives.current = lives;
      return () => clearTimeout(t);
    }
    prevLives.current = lives;
  }, [lives]);

  return (
    <div
      className={`flex gap-0.5 items-center ${shaking ? "animate-shake" : ""}`}
      aria-label={`${lives} lives remaining`}
    >
      {Array.from({ length: MAX_LIVES }).map((_, i) => (
        <span
          key={i}
          className="text-xl transition-all duration-300"
          style={{
            filter: i < lives ? "none" : "grayscale(1) brightness(0.4)",
            transform: i < lives ? "scale(1)" : "scale(0.85)",
          }}
        >
          ❤️
        </span>
      ))}
    </div>
  );
};

// ─── Stat badge ───────────────────────────────────────────────────────────────

const StatBadge: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="text-center min-w-[40px]">
    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-white font-bold text-base leading-tight tabular-nums">{value}</p>
  </div>
);

// ─── Win overlay ──────────────────────────────────────────────────────────────

const WinOverlay: React.FC<{
  moves: number;
  timeLabel: string;
  levelId: number;
  isLastLevel: boolean;
  onReset: () => void;
  onNextLevel: () => void;
}> = ({ moves, timeLabel, levelId, isLastLevel, onReset, onNextLevel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-5"
         style={{ animation: "fadeScaleIn 0.35s ease-out both" }}>

      <div className="text-6xl">🚂✨</div>

      <h2 className="text-3xl font-extrabold text-white tracking-tight text-center">
        {isLastLevel ? "All Levels Complete!" : "Level Clear!"}
      </h2>

      <p className="text-slate-300 text-sm text-center max-w-xs">
        {isLastLevel
          ? "You've cleared Grand Central — all trains have departed! 🎉"
          : `Level ${levelId} cleared! Ready for the next challenge?`}
      </p>

      {/* Stats */}
      <div className="flex gap-8 mt-1">
        <div className="text-center">
          <p className="text-4xl font-bold text-emerald-400 tabular-nums">{moves}</p>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">moves</p>
        </div>
        <div className="h-14 w-px bg-slate-600" />
        <div className="text-center">
          <p className="text-4xl font-bold text-blue-400 tabular-nums">{timeLabel}</p>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">time</p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-1 w-full">
        <button
          onClick={onReset}
          className="
            flex-1 px-4 py-2.5 rounded-xl font-semibold text-white
            bg-slate-700 hover:bg-slate-600 border border-slate-500
            transition-colors text-sm
          "
        >
          ↺ Replay
        </button>

        {isLastLevel ? (
          <button
            onClick={onNextLevel}
            className="
              flex-1 px-4 py-2.5 rounded-xl font-bold text-white
              bg-emerald-600 hover:bg-emerald-500
              transition-colors text-sm
            "
          >
            🔁 Play Again
          </button>
        ) : (
          <button
            onClick={onNextLevel}
            className="
              flex-1 px-4 py-2.5 rounded-xl font-bold text-white
              bg-emerald-600 hover:bg-emerald-500
              transition-colors text-sm
            "
          >
            Next Level →
          </button>
        )}
      </div>
    </div>
  </div>
);

// ─── Game Over overlay ────────────────────────────────────────────────────────

const GameOverOverlay: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
    <div className="bg-slate-900 border-2 border-red-700 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-5"
         style={{ animation: "fadeScaleIn 0.4s ease-out both" }}>

      {/* Crash emoji */}
      <div className="text-7xl" style={{ animation: "trainShake 0.6s ease-in-out" }}>💥</div>

      <h2 className="text-4xl font-extrabold text-red-500 tracking-widest uppercase">
        Game Over
      </h2>

      <p className="text-slate-300 text-sm text-center max-w-xs">
        All 3 lives lost — the train crashed and couldn't return!
        <br />
        Try again and find the right order.
      </p>

      {/* Hearts — all empty */}
      <div className="flex gap-2 text-2xl" style={{ filter: "grayscale(1) brightness(0.4)" }}>
        {Array.from({ length: MAX_LIVES }).map((_, i) => (
          <span key={i}>❤️</span>
        ))}
      </div>

      <button
        onClick={onReset}
        className="
          mt-2 w-full px-8 py-3 rounded-xl font-bold text-white
          bg-red-600 hover:bg-red-500
          transition-colors focus:outline-none focus:ring-2 focus:ring-red-400
          text-sm uppercase tracking-wider
        "
      >
        🔄 Try Again
      </button>
    </div>
  </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
