export const getVideosLoading = ({ videos }) => videos.loading
export const getVideosError = ({ videos }) => videos.error
export const getVideosMessage = ({ videos }) => videos.message

// Upload selectors
export const getVideosUploadLoading = ({ videos }) => videos.uploadLoading
export const getVideosUploadProgress = ({ videos }) => videos.uploadProgress

// Videos list selectors
export const getVideosList = ({ videos }) => videos.videos
export const getSubscriptionVideosList = ({ videos }) => videos.subscriptionVideos

// Channel videos selectors
export const getChannelVideosItems = ({ videos }) => videos.channelVideos.items
export const getChannelVideosPage = ({ videos }) => videos.channelVideos.page
export const getChannelVideosLimit = ({ videos }) => videos.channelVideos.limit
export const getChannelVideosHasMore = ({ videos }) => videos.channelVideos.hasMore
export const getChannelVideosContextKey = ({ videos }) => videos.channelVideos.contextKey

// Videos picker selectors
export const getVideosPickerChannelId = ({ videos }) => videos.picker.channelId
export const getVideosPickerItems = ({ videos }) => videos.picker.items

// Watch selectors
export const getWatchCurrentVideo = ({ videos }) => videos.watch.currentVideo
export const getWatchPlaylist = ({ videos }) => videos.watch.playlist
export const getWatchSimilarItems = ({ videos }) => videos.watch.similar.items
export const getWatchSimilarHasMore = ({ videos }) => videos.watch.similar.hasMore
export const getWatchSimilarNextCursor = ({ videos }) => videos.watch.similar.nextCursor
export const getWatchSimilarFilter = ({ videos }) => videos.watch.similar.filter
export const getShowPlaylist = ({ videos }) => videos.showPlaylist
