import axios from 'axios'

const API_URL = 'http://localhost:4000'
// const API_URL = process.env.NEXT_PUBLIC_API_URL

const visitorClient = axios.create({
  baseURL: `${API_URL}/api`,
})

export const axiosGetVisitor = async ({ visitorId } = {}) => {
  const { data } = await visitorClient.get('/visitor/init', {
    params: visitorId ? { visitorId } : undefined,
  })
  return data
}

export const axiosUpdateVisitor = async (userData) => {
  const { data } = await visitorClient.post('/visitor/update', userData)
  return data
}