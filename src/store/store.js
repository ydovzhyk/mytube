import { configureStore } from '@reduxjs/toolkit'
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist'

import authReducer from './auth/auth-slice'
import channelsReducer from './channel/channel-slice'
import technicalReducer from './technical/technical-slice'
import videosReducer from './videos/videos-slice'
import playlistsReducer from './playlists/playlists-slice'
import visitorReducer from './visitor/visitor-slice'
import playerReducer from './player/player-slice'
import { setupInterceptors } from '../lib/api/auth'
// import logger from 'redux-logger'

const isServer = typeof window === 'undefined'

const createPersistedAuthReducer = () => {
  if (isServer) return authReducer
  const storage = require('redux-persist/lib/storage').default
  const cfg = {
    key: 'auth-local',
    storage,
    whitelist: [],
  }
  return persistReducer(cfg, authReducer)
}

const createPersistedPlayerReducer = () => {
  if (isServer) return playerReducer
  const storage = require('redux-persist/lib/storage').default

  const cfg = {
    key: 'player-local',
    storage,
    whitelist: [
      'volumeLevel',
      'muted',
      'preferredQuality',
      'backPrevAllowed',
      'currentVideoId',
      'playback',
    ],
  }

  return persistReducer(cfg, playerReducer)
}

const finalAuthReducer = createPersistedAuthReducer()
const finalPlayerReducer = createPersistedPlayerReducer()

export const store = configureStore({
  reducer: {
    auth: finalAuthReducer,
    technical: technicalReducer,
    player: finalPlayerReducer,
    channels: channelsReducer,
    videos: videosReducer,
    playlists: playlistsReducer,
    visitor: visitorReducer,
  },
  middleware: (getDefaultMiddleware) => {
    const middlewares = getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    })

    // if (!isServer && process.env.NODE_ENV === 'development') {
    //   middlewares.push(logger)
    // }

    return middlewares
  },
})

export const persistor = isServer ? null : persistStore(store)

if (!isServer) {
  setupInterceptors(store)
}
