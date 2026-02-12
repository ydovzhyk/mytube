const WATCH_HISTORY_KEY = 'mytube:watch_history'
const WATCH_HISTORY_LIMIT = 200

export default function readWatchHistory() {
  if (typeof window === 'undefined') return []

  try {
    const raw = sessionStorage.getItem(WATCH_HISTORY_KEY)
    const arr = raw ? JSON.parse(raw) : []

    if (!Array.isArray(arr)) return []

    return arr
      .map((it) => {
        if (!it?.videoId) return null

        return {
          videoId: String(it.videoId),
          watchedAt: it.watchedAt ? new Date(it.watchedAt) : null,
        }
      })
      .filter(Boolean)
      .slice(0, WATCH_HISTORY_LIMIT)
  } catch {
    return []
  }
}
