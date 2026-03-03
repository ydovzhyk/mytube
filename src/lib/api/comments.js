import { instance } from './auth'

// CREATE: POST /comments  (body: { videoId, content, replyTo?, pin? })
export const axiosCreateComment = async ({ videoId, content, replyTo = null, pin = false }) => {
  const { data } = await instance.post('/comments', { videoId, content, replyTo, pin })
  return data // { comment }
}

// GET BY VIDEO: GET /comments/by-video/:videoId?cursor=&limit=&includeReplies=1&repliesLimit=
export const axiosGetCommentsByVideoId = async ({
  videoId,
  cursor = '',
  limit = 10,
  includeReplies = 1,
  repliesLimit = 50,
} = {}) => {
  const id = String(videoId || '').trim()
  const { data } = await instance.get(`/comments/by-video/${id}`, {
    params: {
      cursor: cursor || undefined,
      limit,
      includeReplies,
      repliesLimit,
    },
  })
  return data // { items, nextCursor, hasMore }
}

// EDIT: PATCH /comments/:id  (body: { content })
export const axiosEditComment = async ({ id, content, pin }) => {
  const cid = String(id || '').trim()
  const body = {}
  if (typeof content === 'string') body.content = content
  if (typeof pin === 'boolean') body.pin = pin
  const { data } = await instance.patch(`/comments/${cid}`, body)
  return data
}

// DELETE: DELETE /comments/:id
export const axiosDeleteComment = async (id) => {
  const cid = String(id || '').trim()
  const { data } = await instance.delete(`/comments/${cid}`)
  return data // { message } (or { comment } if you decide to return updated doc)
}

// REACT: POST /comments/:id/react (body: { value: 1|-1|0 })
export const axiosReactComment = async ({ id, value }) => {
  const cid = String(id || '').trim()
  const { data } = await instance.post(`/comments/${cid}/react`, { value })
  return data // { commentId, myReaction, likesCount, dislikesCount }
}
