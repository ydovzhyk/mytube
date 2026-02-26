import { instance } from './auth'

// CREATE: COMMENTS: POST /comments  (body: { videoId, content })
export const axiosCreateComment = async ({ videoId, content }) => {
  const { data } = await instance.post('/comments', { videoId, content })
  return data // { comment }
}

// GET BY VIDEO: GET /comments/by-video/:videoId
export const axiosGetCommentsByVideoId = async (videoId) => {
  const { data } = await instance.get(`/comments/by-video/${videoId}`)
  return data // { comments }
}

// EDIT: PATCH /comments/:id  (body: { content })
export const axiosEditComment = async ({ id, content }) => {
  const { data } = await instance.patch(`/comments/${id}`, { content })
  return data // { comment }
}

// DELETE: DELETE /comments/:id
export const axiosDeleteComment = async (id) => {
  const { data } = await instance.delete(`/comments/${id}`)
  return data // { message }
}