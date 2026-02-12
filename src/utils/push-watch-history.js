const WATCH_HISTORY_KEY = 'mytube:watch_history'
const WATCH_HISTORY_LIMIT = 200

export default function pushWatchHistory(videoId) {
  if (!videoId || typeof window === 'undefined') return

  const id = String(videoId).trim()
  if (!id) return

  try {
    const raw = sessionStorage.getItem(WATCH_HISTORY_KEY)
    const arr = raw ? JSON.parse(raw) : []
    const items = Array.isArray(arr) ? arr : []

    const now = new Date().toISOString()

    const filtered = items.filter((it) => String(it?.videoId) !== id)

    filtered.unshift({
      videoId: id,
      watchedAt: now,
    })

    sessionStorage.setItem(
      WATCH_HISTORY_KEY,
      JSON.stringify(filtered.slice(0, WATCH_HISTORY_LIMIT))
    )
  } catch {}
}
