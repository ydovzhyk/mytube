import { instance } from './auth'

export const axiosCreateChannel = async (userData) => {
  const { data } = await instance.post(`/channel/create-channel`, userData)
  return data
}

export const axiosGetChannel = async () => {
  const { data } = await instance.get(`/channel/get-channel`)
  return data
}

export const axiosEditChannel = async (userData) => {
  const { data } = await instance.put(`/channel/edit-channel`, userData)
  return data
}

export const axiosDeleteChannel = async (id) => {
  const { data } = await instance.delete(`/channel/delete/${id}`)
  return data
}
