export const getVideosLoading = ({ videos }) => videos.loading
export const getVideosUploadLoading = ({ videos }) => videos.uploadLoading
export const getVideosUploadProgress = ({ videos }) => videos.uploadProgress
export const getVideosError = ({ videos }) => videos.error
export const getVideosMessage = ({ videos }) => videos.message
export const getVideosList = ({ videos }) => videos.videos
export const getSubscriptionVideosList = ({ videos }) => videos.subscriptionVideos

export const getChannelVideosItems = ({ videos }) => videos.channelVideos.items
export const getChannelVideosPage = ({ videos }) => videos.channelVideos.page
export const getChannelVideosLimit = ({ videos }) => videos.channelVideos.limit
export const getChannelVideosHasMore = ({ videos }) => videos.channelVideos.hasMore
export const getChannelVideosContextKey = ({ videos }) => videos.channelVideos.contextKey
export const getVideosPickerChannelId = ({ videos }) => videos.picker.channelId
export const getVideosPickerItems = ({ videos }) => videos.picker.items