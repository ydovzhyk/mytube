import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  error: null,
  message: null,
  loading: false,
};

const technical = createSlice({
  name: 'technical',
  initialState,
  reducers: {
    clearTechnicalError: store => {
      store.error = null;
    },
    clearTechnicalMessage: store => {
      store.message = null;
    },
    setTechnicalError: (store, action) => {
      store.error = action.payload;
    },
  },

  extraReducers: builder => {
    //
    builder
  },
});

export default technical.reducer;

export const {
  clearTechnicalError,
  clearTechnicalMessage,
  setTechnicalError,
} = technical.actions;
