/**
 * useGameState.ts — Central game hook with lives, crash animations, and level progression.
 *
 * Blocked tap flow:
 *   1. Calculate pixel distance to first blocker.
 *   2a. Lives > 1: START_CRASH → train lunges + bounces back (900ms), lose 1 life.
 *   2b. Last life: START_CRASH_STAY → train lunges and STAYS crashed (550ms),
 *       then phase="game-over" appears.
 *
 * Valid tap flow:
 *   START_SLIDE → train exits board (450ms) → REMOVE_TRAIN.
 *   When trains=0: phase="won", backend stubs called.
 *
 * Level progression:
 *   advanceToNextLevel() loads the next level (or loops back to 1 on the last).
 */

import { useCallback, useEffect, useReducer, useRef } from "react";
import type {
  GameState, Train, AnimationMap, GamePhase,
} from "../types/game";
import { CELL_SIZE_PX, MAX_LIVES } from "../types/game";
import { GridManager } from "../engine/GridManager";
import { DIRECTION_VECTORS } from "../engine/GridManager";
import { canTrainEscape, getDistanceToFirstBlocker } from "../engine/MovementValidator";
import { loadLevel, MAX_LEVEL_ID } from "../engine/LevelLoader";
import { onLevelComplete, broadcastCompletion } from "../backend/backendService";
import { playTrainHorn, playCrashSound, playWinSound, playLoseSound } from "../audio";

// ─── Timing ───────────────────────────────────────────────────────────────────
const SLIDE_MS        = 450;
const CRASH_MS        = 900;   // lunge + bounce-back
const CRASH_STAY_MS   = 550;   // lunge only, stays at blocker
const GAME_OVER_DELAY = 650;   // extra ms after crash-stay before overlay appears

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "LOAD_LEVEL";       levelId: number }
  | { type: "START_SLIDE";      trainId: string }
  | { type: "REMOVE_TRAIN";     trainId: string }
  | { type: "START_CRASH";      trainId: string; dx: number; dy: number }
  | { type: "CLEAR_CRASH";      trainId: string }
  | { type: "START_CRASH_STAY"; trainId: string; dx: number; dy: number }
  | { type: "SET_PHASE";        phase: GamePhase }
  | { type: "TICK" };

// ─── Initial state ────────────────────────────────────────────────────────────

function buildInitialState(levelId: number): GameState {
  const level = loadLevel(levelId);
  const occupancy = GridManager.buildOccupancy(level.trains);
  const animations: AnimationMap = Object.fromEntries(
    level.trains.map((t) => [t.id, "idle"])
  );
  return {
    trains:        level.trains,
    occupancy,
    moves:         0,
    startTimeMs:   Date.now(),
    phase:         "playing",
    animations,
    lives:         MAX_LIVES,
    crashDistances: {},
    currentLevelId: levelId,
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {

    case "LOAD_LEVEL":
      return buildInitialState(action.levelId);

    // ── Slide out ─────────────────────────────────────────────────────────
    case "START_SLIDE": {
      const nextTrains = state.trains.map(t => 
        t.id === action.trainId ? { ...t, bodyOffsets: undefined } : t
      );
      return {
        ...state,
        trains: nextTrains,
        moves: state.moves + 1,
        animations: { ...state.animations, [action.trainId]: "slide" },
      };
    }

    case "REMOVE_TRAIN": {
      const nextTrains = state.trains.filter((t) => t.id !== action.trainId);
      const { [action.trainId]: _anim, ...restAnimations } = state.animations;
      const { [action.trainId]: _crash, ...restCrash } = state.crashDistances;
      return {
        ...state,
        trains:         nextTrains,
        occupancy:      GridManager.buildOccupancy(nextTrains),
        animations:     restAnimations,
        crashDistances: restCrash,
      };
    }

    // ── Normal crash (lives > 1) — train returns after animation ─────────
    case "START_CRASH":
      return {
        ...state,
        lives: state.lives - 1,
        animations:     { ...state.animations,    [action.trainId]: "crash" },
        crashDistances: { ...state.crashDistances, [action.trainId]: { x: action.dx, y: action.dy } },
      };

    case "CLEAR_CRASH": {
      const { [action.trainId]: _c, ...restCrash } = state.crashDistances;
      return {
        ...state,
        animations:     { ...state.animations, [action.trainId]: "idle" },
        crashDistances: restCrash,
      };
    }

    // ── Last-life crash — train stays crashed, phase=crashing ─────────────
    case "START_CRASH_STAY":
      return {
        ...state,
        lives:          0,
        phase:          "crashing",   // brief intermediate before overlay
        animations:     { ...state.animations,    [action.trainId]: "crash-stay" },
        crashDistances: { ...state.crashDistances, [action.trainId]: { x: action.dx, y: action.dy } },
      };

    case "SET_PHASE":
      return { ...state, phase: action.phase };

    case "TICK":
      return { ...state }; // force re-render for elapsed timer

    default:
      return state;
  }
}

// ─── Hook return type ─────────────────────────────────────────────────────────

export interface UseGameStateReturn {
  state: GameState;
  elapsedSeconds: number;
  handleTrainTap:     (trainId: string) => void;
  resetLevel:         () => void;
  advanceToNextLevel: () => void;
  isLastLevel:        boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGameState(): UseGameStateReturn {
  const [state, dispatch] = useReducer(reducer, undefined, () => buildInitialState(1));
  const pendingAnimations = useRef<Set<string>>(new Set());

  // Refs to avoid stale closures in setTimeout callbacks.
  const livesRef  = useRef<number>(MAX_LIVES);
  const phaseRef  = useRef<GamePhase>("playing");
  livesRef.current = state.lives;
  phaseRef.current = state.phase;

  // ── Timer tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== "playing") return;
    const id = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(id);
  }, [state.phase]);

  // ── Win detection ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.trains.length === 0 && state.phase === "playing") {
      playWinSound(); dispatch({ type: "SET_PHASE", phase: "won" });
      const elapsed = Math.floor((Date.now() - state.startTimeMs) / 1000);
      onLevelComplete(elapsed, state.moves, state.currentLevelId);
      broadcastCompletion(state.currentLevelId, elapsed, state.moves);
    }
  }, [state.trains.length, state.phase, state.moves, state.startTimeMs, state.currentLevelId]);

  // ── Train tap handler ─────────────────────────────────────────────────────
  const handleTrainTap = useCallback((trainId: string) => {
    // Block taps during any non-playing phase.
    if (phaseRef.current !== "playing") return;
    if (pendingAnimations.current.has(trainId)) return;

    const train: Train | undefined = GridManager.findTrainById(state.trains, trainId);
    if (!train) return;

    const { canEscape } = canTrainEscape(train, state.occupancy);

    if (!canEscape) {
      // ── CRASH: calculate how far to lunge ──────────────────────────────
      const emptyCells = getDistanceToFirstBlocker(train, state.occupancy);
      const vec        = DIRECTION_VECTORS[train.direction];
      // Lunge = empty cells + 0.65-cell dramatic overshoot into blocker.
      const dx = vec.x * (emptyCells + 0.65) * CELL_SIZE_PX;
      const dy = vec.y * (emptyCells + 0.65) * CELL_SIZE_PX;

      pendingAnimations.current.add(trainId);

      const isLastLife = livesRef.current <= 1;

      if (isLastLife) { playCrashSound();
        // ── Game-over crash: stays at blocker ────────────────────────────
        dispatch({ type: "START_CRASH_STAY", trainId, dx, dy });
        setTimeout(() => {
          playLoseSound(); dispatch({ type: "SET_PHASE", phase: "game-over" });
          pendingAnimations.current.delete(trainId);
        }, CRASH_STAY_MS + GAME_OVER_DELAY);
      } else { playCrashSound();
        // ── Normal crash: bounces back ────────────────────────────────────
        dispatch({ type: "START_CRASH", trainId, dx, dy });
        setTimeout(() => {
          dispatch({ type: "CLEAR_CRASH", trainId });
          pendingAnimations.current.delete(trainId);
        }, CRASH_MS);
      }

    } else {
      // ── SLIDE: valid escape ───────────────────────────────────────────────
      pendingAnimations.current.add(trainId);
      playTrainHorn(); dispatch({ type: "START_SLIDE", trainId });
      setTimeout(() => {
        dispatch({ type: "REMOVE_TRAIN", trainId });
        pendingAnimations.current.delete(trainId);
      }, SLIDE_MS);
    }
  }, [state.phase, state.trains, state.occupancy]);

  // ── Reset current level (3 fresh lives) ──────────────────────────────────
  const resetLevel = useCallback(() => {
    pendingAnimations.current.clear();
    dispatch({ type: "LOAD_LEVEL", levelId: state.currentLevelId });
  }, [state.currentLevelId]);

  // ── Advance to next level ─────────────────────────────────────────────────
  const advanceToNextLevel = useCallback(() => {
    pendingAnimations.current.clear();
    const next = state.currentLevelId < MAX_LEVEL_ID
      ? state.currentLevelId + 1
      : 1; // loop back to start if all levels done
    dispatch({ type: "LOAD_LEVEL", levelId: next });
  }, [state.currentLevelId]);

  const isLastLevel    = state.currentLevelId >= MAX_LEVEL_ID;
  const elapsedSeconds = Math.floor((Date.now() - state.startTimeMs) / 1000);

  return { state, elapsedSeconds, handleTrainTap, resetLevel, advanceToNextLevel, isLastLevel };
}
