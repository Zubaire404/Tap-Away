/**
 * backendService.ts — Stub integrations for Supabase & SignalR.
 *
 * These functions are intentionally empty shells with correct TypeScript
 * signatures. Wire them up to real implementations once the backend is ready:
 *
 * SUPABASE WIRING:
 *   import { createClient } from '@supabase/supabase-js';
 *   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 *   Then replace the TODO bodies below.
 *
 * SIGNALR WIRING:
 *   import * as signalR from '@microsoft/signalr';
 *   const connection = new signalR.HubConnectionBuilder()
 *     .withUrl('/chatHub')
 *     .build();
 *   Then call connection.invoke('Announce', ...) in broadcastCompletion().
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape of the payload sent to the Supabase leaderboard table. */
export interface LevelCompletePayload {
  /** ISO-8601 date string — the daily challenge date. */
  challengeDate: string;
  /** Total elapsed time in whole seconds. */
  timeInSeconds: number;
  /** Number of valid taps (moves) made to clear the board. */
  movesMade: number;
  /** Player identifier — to be replaced with Supabase Auth user id. */
  playerId: string;
}

/** Shape of the victory announcement broadcast via SignalR. */
export interface VictoryAnnouncement {
  playerId: string;
  levelId: number;
  timeInSeconds: number;
  movesMade: number;
  timestamp: string;
}

// ─── Supabase stub ────────────────────────────────────────────────────────────

/**
 * Called when the player clears all trains from the board.
 *
 * Wire this to a Supabase `INSERT` into your leaderboard table.
 *
 * @param timeInSeconds - Total elapsed time from level load to board clear.
 * @param movesMade     - Count of successful (non-blocked) taps.
 * @param levelId       - Which level was completed.
 */
export async function onLevelComplete(
  timeInSeconds: number,
  movesMade: number,
  levelId: number = 1
): Promise<void> {
  const payload: LevelCompletePayload = {
    challengeDate: new Date().toISOString().split("T")[0], // "YYYY-MM-DD"
    timeInSeconds,
    movesMade,
    playerId: "anonymous", // TODO: replace with supabase.auth.getUser()
  };

  // ── TODO: Uncomment and configure once Supabase is set up ──────────────
  // const { error } = await supabase
  //   .from("daily_challenge_results")
  //   .insert([{ ...payload, level_id: levelId }]);
  // if (error) console.error("[Supabase] Insert failed:", error);
  // ────────────────────────────────────────────────────────────────────────

  console.info(
    "[Backend] onLevelComplete fired — payload ready for Supabase:",
    payload,
    "levelId:",
    levelId
  );
}

// ─── SignalR stub ─────────────────────────────────────────────────────────────

/**
 * Broadcasts the player's victory to an external C# SignalR chat lobby.
 *
 * Wire this to a SignalR HubConnection once the hub URL is available.
 *
 * @param levelId       - The level that was just completed.
 * @param timeInSeconds - Time taken.
 * @param movesMade     - Moves used.
 */
export function broadcastCompletion(
  levelId: number,
  timeInSeconds: number,
  movesMade: number
): void {
  const announcement: VictoryAnnouncement = {
    playerId: "anonymous", // TODO: replace with authenticated user id
    levelId,
    timeInSeconds,
    movesMade,
    timestamp: new Date().toISOString(),
  };

  // ── TODO: Uncomment and configure once SignalR hub is set up ───────────
  // await connection.invoke("AnnounceVictory", announcement);
  // ────────────────────────────────────────────────────────────────────────

  console.info(
    "[Backend] broadcastCompletion fired — announcement ready for SignalR:",
    announcement
  );
}
