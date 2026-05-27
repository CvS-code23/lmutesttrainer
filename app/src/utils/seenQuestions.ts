// lmu_seen_v2 stores { [questionId]: lastScore }
// v1 (plain string[]) is migrated on first read
const KEY = 'lmu_seen_v2'
const KEY_V1 = 'lmu_seen_v1'

export interface SeenEntry {
  lastScore: number  // 0 | 1 | 3 | 5
}

type SeenMap = Record<string, SeenEntry>

function migrate(): SeenMap {
  try {
    const raw = localStorage.getItem(KEY_V1)
    if (!raw) return {}
    const ids = JSON.parse(raw) as string[]
    // Old data has no score info — treat as unknown (score -1)
    const map: SeenMap = {}
    for (const id of ids) map[id] = { lastScore: -1 }
    localStorage.removeItem(KEY_V1)
    return map
  } catch {
    return {}
  }
}

export function getSeenMap(): SeenMap {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as SeenMap
    // Try migrating from v1
    const migrated = migrate()
    if (Object.keys(migrated).length > 0) {
      localStorage.setItem(KEY, JSON.stringify(migrated))
    }
    return migrated
  } catch {
    return {}
  }
}

export function getSeenIds(): Set<string> {
  return new Set(Object.keys(getSeenMap()))
}

export interface SeenResult {
  id: string
  score: number
}

export function markSeen(results: SeenResult[]): void {
  if (results.length === 0) return
  const map = getSeenMap()
  for (const { id, score } of results) {
    map[id] = { lastScore: score }
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    // storage full — ignore
  }
}

export function clearSeen(): void {
  localStorage.removeItem(KEY)
  localStorage.removeItem(KEY_V1)
}
