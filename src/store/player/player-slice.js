import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  error: null,
  message: null,
  loading: false,

  backPrevAllowed: false,
  volumeLevel: 0.2,
  muted: false,
  preferredQuality: null,
  fullscreenWanted: false,

  // player (global shell)
  currentVideoId: null,
  isPlaying: false,
  mode: 'closed',
  playbackTimeById: {},

  // playback snapshot (persist)
  playback: {
    video: null,
    itemsById: {},

    queue: {
      ids: [],
      index: 0,
      listId: null,
      seed: 'watch',
      playlistLen: 0,
    },
  },
}

const clamp01 = (n, fallback = 0.2) => {
  const x = Number(n)
  return Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : fallback
}

function toId(v) {
  if (!v) return null
  const id = v?._id ?? v?.id ?? v
  const s = String(id || '').trim()
  return s ? s : null
}

function normalizeSources(sources) {
  if (!sources || typeof sources !== 'object') return {}
  const out = {}
  for (const [k, v] of Object.entries(sources)) {
    if (!v) continue
    const q = String(k).trim().toLowerCase().replace('p', '')
    const n = Number(q)
    if (!Number.isFinite(n) || n <= 0) continue
    out[String(n)] = v
  }
  return out
}

function uniqIds(arr) {
  const out = []
  const seen = new Set()
  for (const x of arr || []) {
    const id = toId(x)
    if (!id) continue
    if (seen.has(id)) continue
    seen.add(id)
    out.push(String(id))
  }
  return out
}

function toPlaybackItem(v) {
  const id = toId(v)
  if (!id) return null
  return {
    id: String(id),
    poster: String(v?.thumbnailUrl || v?.poster || ''),
    sources: normalizeSources(v?.sources),
    availableQualities: Array.isArray(v?.availableQualities)
      ? v.availableQualities.map(Number).filter((n) => Number.isFinite(n))
      : [360, 480, 720],
  }
}

/**
 * NEW Queue policy:
 * - If playlist exists AND current is inside it:
 *     queue = [ ...playlistIds, ...similarTailWithoutDupes ]
 *     index = playlistIndex
 *     playlistLen = playlistIds.length
 * - Otherwise:
 *     queue = [current, ...similar(excluding current)]
 *     index = 0
 *     playlistLen = 0
 *
 * NOTE:
 * - We DO NOT auto-fetch new similar for each playlist item.
 * - similarTail is based on the "first selected" watch payload.
 */
function buildQueue({ currentVideoId, playlistItems, similarItems }) {
  const cur = currentVideoId ? String(currentVideoId) : null

  const playlistIds = uniqIds(playlistItems)
  const similarIdsAll = uniqIds(similarItems)

  // remove current from similar
  const similarIds = similarIdsAll.filter((id) => String(id) !== String(cur || ''))

  if (playlistIds.length && cur) {
    const idx = playlistIds.indexOf(cur)
    if (idx >= 0) {
      // Tail: recommended items that are NOT already in playlist
      const tail = similarIds.filter((id) => !playlistIds.includes(id))
      return {
        ids: [...playlistIds, ...tail],
        index: idx,
        seed: 'playlist',
        playlistLen: playlistIds.length,
      }
    }
  }

  const ids = cur ? [cur, ...similarIds] : [...similarIds]
  return {
    ids,
    index: 0,
    seed: similarIds.length ? 'similar' : 'watch',
    playlistLen: 0,
  }
}

const player = createSlice({
  name: 'player',
  initialState,
  reducers: {
    clearPlayerError: (state) => {
      state.error = null
    },
    clearPlayerMessage: (state) => {
      state.message = null
    },
    setPlayerError: (state, action) => {
      state.error = action.payload
    },
    setBackPrevAllowed: (state, action) => {
      state.backPrevAllowed = Boolean(action.payload)
    },
    setVolumeLevel: (state, action) => {
      state.volumeLevel = clamp01(action.payload, 0.2)
    },
    setMuted: (state, action) => {
      state.muted = Boolean(action.payload)
    },
    setPreferredQuality: (state, action) => {
      const n = Number(action.payload)
      state.preferredQuality = Number.isFinite(n) ? n : null
    },
    setFullscreenWanted: (state, action) => {
      state.fullscreenWanted = Boolean(action.payload)
    },
    // shell state
    setCurrentVideoId: (state, action) => {
      state.currentVideoId = action.payload ? String(action.payload) : null
      const id = state.currentVideoId
      const item = id ? state.playback.itemsById?.[String(id)] : null
      if (item) state.playback.video = item
    },
    setIsPlaying: (state, action) => {
      state.isPlaying = Boolean(action.payload)
    },
    setPlayerMode: (state, action) => {
      const m = action.payload
      if (m === 'full' || m === 'mini' || m === 'closed') state.mode = m
    },
    setPlaybackTime: (state, action) => {
      const { videoId, time } = action.payload || {}
      const id = videoId ? String(videoId) : null
      const t = Number(time)
      if (!id) return
      if (!Number.isFinite(t) || t < 0) return
      state.playbackTimeById[id] = t
    },
    clearPlaybackTime: (state, action) => {
      const id = action.payload ? String(action.payload) : null
      if (!id) return
      delete state.playbackTimeById[id]
    },
    setPlaybackSnapshot: (state, action) => {
      const p = action.payload || {}
      const cv = p.currentVideo || null
      const curId = toId(cv)

      if (!curId) {
        state.playback.video = null
        state.playback.itemsById = {}
        state.playback.queue.ids = []
        state.playback.queue.index = 0
        state.playback.queue.listId = null
        state.playback.queue.seed = 'watch'
        state.playback.queue.playlistLen = 0
        state.currentVideoId = null
        return
      }

      const playlistItems = Array.isArray(p?.playlist?.items) ? p.playlist.items : []
      const similarItems = Array.isArray(p?.similarItems) ? p.similarItems : []

      // build lookup map for instant switching in queue
      const map = {}
      const put = (v) => {
        const it = toPlaybackItem(v)
        if (!it) return
        map[it.id] = it
      }

      put(cv)
      playlistItems.forEach(put)
      similarItems.forEach(put)

      const q = buildQueue({
        currentVideoId: String(curId),
        playlistItems,
        similarItems,
      })

      state.playback.itemsById = map
      state.playback.queue.ids = q.ids
      state.playback.queue.index = q.index
      state.playback.queue.seed = q.seed
      state.playback.queue.playlistLen = Number(q.playlistLen || 0)

      // ONLY from URL param listId
      state.playback.queue.listId = p?.listId ? String(p.listId) : null

      // sync current id + active item
      state.currentVideoId = String(curId)
      state.playback.video = map[String(curId)] || toPlaybackItem(cv) || null
    },
    setQueueIndex: (state, action) => {
      const n = Number(action.payload)
      if (!Number.isFinite(n)) return

      const ids = state.playback.queue.ids || []
      if (!ids.length) {
        state.playback.queue.index = 0
        return
      }

      state.playback.queue.index = Math.max(0, Math.min(ids.length - 1, n))
      const id = ids[state.playback.queue.index]
      if (id) {
        state.currentVideoId = String(id)
        const item = state.playback.itemsById?.[String(id)]
        if (item) state.playback.video = item
      }
    },
    resetPlayback: (state) => {
      state.playback.video = null
      state.playback.itemsById = {}
      state.playback.queue.ids = []
      state.playback.queue.index = 0
      state.playback.queue.listId = null
      state.playback.queue.seed = 'watch'
      state.playback.queue.playlistLen = 0
      state.currentVideoId = null
      state.isPlaying = false
      state.mode = 'closed'
    },
    resetPlayer: () => initialState,
  },
})

export default player.reducer

export const {
  clearPlayerError,
  clearPlayerMessage,
  setPlayerError,

  setBackPrevAllowed,
  setVolumeLevel,
  setMuted,
  setPreferredQuality,
  setFullscreenWanted,

  setCurrentVideoId,
  setIsPlaying,
  setPlayerMode,

  setPlaybackSnapshot,
  setQueueIndex,

  resetPlayback,
  resetPlayer,
  setPlaybackTime,
  clearPlaybackTime,
} = player.actions
