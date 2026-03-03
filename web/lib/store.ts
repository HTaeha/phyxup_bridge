import type { StoreEntry, EntryAnalysis } from "./types";

const MAX_ENTRIES = 100;

// ── KV keys ──
const ENTRIES_KEY = "entries";
const NEXT_ID_KEY = "next_id";

function kvAvailable() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// ── In-memory fallback ──
let memEntries: StoreEntry[] = [];
let memNextId = 1;

export async function addEntry(
  text: string,
  timestamp?: number
): Promise<StoreEntry> {
  if (kvAvailable()) {
    const { kv } = await import("@vercel/kv");
    const id = await kv.incr(NEXT_ID_KEY);
    const entry: StoreEntry = {
      id,
      text,
      timestamp: timestamp ?? Date.now(),
      analysis: null,
    };
    await kv.lpush(ENTRIES_KEY, entry);
    await kv.ltrim(ENTRIES_KEY, 0, MAX_ENTRIES - 1);
    return entry;
  }

  const entry: StoreEntry = {
    id: memNextId++,
    text,
    timestamp: timestamp ?? Date.now(),
    analysis: null,
  };
  memEntries.unshift(entry);
  if (memEntries.length > MAX_ENTRIES) memEntries.length = MAX_ENTRIES;
  return entry;
}

export async function getEntries(): Promise<StoreEntry[]> {
  if (kvAvailable()) {
    const { kv } = await import("@vercel/kv");
    return kv.lrange<StoreEntry>(ENTRIES_KEY, 0, -1);
  }
  return memEntries;
}

export async function updateAnalysis(
  id: number,
  analysis: EntryAnalysis
): Promise<StoreEntry | undefined> {
  if (kvAvailable()) {
    const { kv } = await import("@vercel/kv");
    const entries = await kv.lrange<StoreEntry>(ENTRIES_KEY, 0, -1);
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    const updated = { ...entries[idx], analysis };
    await kv.lset(ENTRIES_KEY, idx, updated);
    return updated;
  }

  const entry = memEntries.find((e) => e.id === id);
  if (entry) entry.analysis = analysis;
  return entry;
}
