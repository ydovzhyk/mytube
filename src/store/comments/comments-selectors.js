const safeId = (v) => {
  const s = String(v || '').trim()
  return s ? s : ''
}

export const getCommentsError = ({ comments }) => comments.error
export const getCommentsMessage = ({ comments }) => comments.message

export const getCommentsByVideoId =
  (videoId) =>
  ({ comments }) => {
    const id = safeId(videoId)
    if (!id) return []
    const arr = comments.commentsByVideoId?.[id]
    return Array.isArray(arr) ? arr : []
  }
