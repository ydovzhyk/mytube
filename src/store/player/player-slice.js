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

  // player (new)
  currentVideoId: null, // string | null
  isPlaying: false, // boolean
  mode: 'closed', // 'full' | 'mini' | 'closed'
}

const clamp01 = (n, fallback = 0.2) => {
  const x = Number(n)
  return Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : fallback
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

    // NEW
    setCurrentVideoId: (state, action) => {
      state.currentVideoId = action.payload ? String(action.payload) : null
    },
    setIsPlaying: (state, action) => {
      state.isPlaying = Boolean(action.payload)
    },
    setPlayerMode: (state, action) => {
      const m = action.payload
      if (m === 'full' || m === 'mini' || m === 'closed') state.mode = m
    },

    resetPlayer: () => ({ ...initialState }),
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

  resetPlayer,
} = player.actions
