import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  error: null,
  message: null,
  loading: false,

  volumeLevel: 0.2,
  muted: false,
  preferredQuality: null,
  theaterMode: false,
  fullscreenWanted: false,
}

const technical = createSlice({
  name: 'technical',
  initialState,
  reducers: {
    clearTechnicalError: (state) => {
      state.error = null
    },
    clearTechnicalMessage: (state) => {
      state.message = null
    },
    setTechnicalError: (state, action) => {
      state.error = action.payload
    },
    setVolumeLevel: (state, action) => {
      const n = Number(action.payload)
      state.volumeLevel = Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.2
    },
    setMuted: (state, action) => {
      state.muted = Boolean(action.payload)
    },
    setPreferredQuality: (state, action) => {
      const n = Number(action.payload)
      state.preferredQuality = Number.isFinite(n) ? n : null
    },
    setTheaterMode: (state, action) => {
      state.theaterMode = Boolean(action.payload)
    },
    setFullscreenWanted: (state, action) => {
      state.fullscreenWanted = Boolean(action.payload)
    },
  },

  extraReducers: (builder) => {
    //
    builder
  },
})

export default technical.reducer;

export const {
  clearTechnicalError,
  clearTechnicalMessage,
  setTechnicalError,
  setVolumeLevel,
  setMuted,
  setPreferredQuality,
  setTheaterMode,
  setFullscreenWanted } =
  technical.actions
