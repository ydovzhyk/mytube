const safeId = (v) => {
  const s = String(v || '').trim()
  return s ? s : ''
}

export const getCommentsError = ({ comments }) => comments.error
export const getCommentsMessage = ({ comments }) => comments.message

export const getCommentsItemsByVideoId =
  (videoId) =>
  ({ comments }) => {
    const id = safeId(videoId)
    if (!id) return []
    const items = comments.byVideoId?.[id]?.items
    return Array.isArray(items) ? items : []
  }

export const getCommentsLoadingByVideoId =
  (videoId) =>
  ({ comments }) => {
    const id = safeId(videoId)
    if (!id) return false
    return Boolean(comments.byVideoId?.[id]?.loading)
  }

export const getCommentsHasMoreByVideoId =
  (videoId) =>
  ({ comments }) => {
    const id = safeId(videoId)
    if (!id) return false
    return Boolean(comments.byVideoId?.[id]?.hasMore)
  }

export const getCommentsCursorByVideoId =
  (videoId) =>
  ({ comments }) => {
    const id = safeId(videoId)
    if (!id) return ''
    return String(comments.byVideoId?.[id]?.cursor || '')
  }
