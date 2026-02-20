import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  error: null,
  message: null,
  loading: false,
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
} = technical.actions
