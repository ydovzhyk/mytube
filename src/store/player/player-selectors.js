export const getBackPrevAllowed = ({ player }) => player.backPrevAllowed
export const getVolumeLevel = ({ player }) => player.volumeLevel
export const getMuted = ({ player }) => player.muted
export const getPreferredQuality = ({ player }) => player.preferredQuality
export const getFullscreenWanted = ({ player }) => player.fullscreenWanted

export const getPlayerCurrentVideoId = ({ player }) => player.currentVideoId
export const getPlayerIsPlaying = ({ player }) => player.isPlaying
export const getPlayerMode = ({ player }) => player.mode

export const getPlaybackVideo = ({ player }) => player.playback?.video || null
export const getPlaybackItemsById = ({ player }) => player.playback?.itemsById || {}
export const getPlaybackQueueIds = ({ player }) => player.playback?.queue?.ids || []
export const getPlaybackQueueIndex = (state) => Number(state.player?.playback?.queue?.index || 0)
export const getPlaybackListId = ({ player }) => player.playback?.queue?.listId || null
export const getPlaybackSeed = ({ player }) => player.playback?.queue?.seed || 'watch'
export const getPlaybackPlaylistLen = ({ player }) =>
  Number(player.playback?.queue?.playlistLen || 0)

export const getPlaybackPrevId = (state) => {
  const ids = getPlaybackQueueIds(state)
  const index = getPlaybackQueueIndex(state)
  if (!Array.isArray(ids) || ids.length === 0) return null
  if (index <= 0) return null
  return ids[index - 1] || null
}

export const getPlaybackNextId = (state) => {
  const ids = getPlaybackQueueIds(state)
  const index = getPlaybackQueueIndex(state)
  if (!Array.isArray(ids) || ids.length === 0) return null
  if (index >= ids.length - 1) return null
  return ids[index + 1] || null
}

export const getPlaybackHasPrev = (state) => Boolean(getPlaybackPrevId(state))
export const getPlaybackHasNext = (state) => Boolean(getPlaybackNextId(state))

export const getPlaybackTimeById = ({ player }) => player.playbackTimeById || {}

export const makeGetPlaybackTime =
  (videoId) =>
  ({ player }) =>
    (player.playbackTimeById || {})[String(videoId || '')] || 0
