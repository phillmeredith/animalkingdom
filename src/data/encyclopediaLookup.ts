// encyclopediaLookup.ts
// Lazy-loaded lookup from /encyclopedia.json (served from public/).
// The JSON is NOT bundled into the main JS chunk — it is fetched on first use.
// Keys are lowercase animal names.
// WARNING: the `type` field from the JSON is unreliable and is NOT exported here.
// WARNING: the `diet` field from the JSON covers only ~2.5% of entries and is NOT exported here.

export interface EncyclopediaEntry {
  description: string | null
  thumbnail: string | null
  wikiUrl: string | null
}

// Module-level cache — populated on first loadEncyclopedia() call.
let _cache: Record<string, EncyclopediaEntry> | null = null
// Shared in-flight promise so concurrent callers don't trigger multiple fetches.
let _promise: Promise<void> | null = null

/**
 * Fetch and populate the encyclopedia cache.
 * Safe to call multiple times — subsequent calls are no-ops once loaded.
 * Throws if the network request fails (callers may catch and ignore gracefully).
 */
export async function loadEncyclopedia(): Promise<void> {
  if (_cache !== null) return
  if (_promise !== null) return _promise

  _promise = (async () => {
    const res = await fetch('/encyclopedia.json')
    if (!res.ok) throw new Error(`Failed to load encyclopedia: ${res.status}`)

    const raw: Array<{
      name?: string
      description?: string | null
      thumbnail?: string | null
      wikiUrl?: string | null
    }> = await res.json()

    const lookup: Record<string, EncyclopediaEntry> = Object.create(null)
    for (const entry of raw) {
      if (!entry.name) continue
      lookup[entry.name.toLowerCase()] = {
        description: entry.description ?? null,
        thumbnail: entry.thumbnail ?? null,
        wikiUrl: entry.wikiUrl ?? null,
      }
    }
    _cache = lookup
  })()

  return _promise
}

/**
 * Look up encyclopedia data for an animal by name (case-insensitive).
 * Returns null when the cache has not been loaded yet, or when no entry exists.
 * Call loadEncyclopedia() first to populate the cache.
 */
export function getEncyclopediaEntry(name: string): EncyclopediaEntry | null {
  if (_cache === null) return null
  return _cache[name.toLowerCase()] ?? null
}
