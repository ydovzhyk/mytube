'use client'

import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'next/navigation'
import { getWatchVideo } from '@/store/videos/videos-operations'
import { resetWatch, setWatchCurrentVideo } from '@/store/videos/videos-slice'
import { getWatchPlaylist } from '@/store/videos/videos-selectors'

export default function WatchIdPage() {
  const dispatch = useDispatch()
  const params = useParams()

  const id = params?.id

  const playlist = useSelector(getWatchPlaylist)
  const playlistItems = useMemo(() => {
    return Array.isArray(playlist?.items) ? playlist.items : []
  }, [playlist])

  useEffect(() => {
    if (!id) return
    const fromPlaylist = playlistItems.find((v) => String(v?._id) === String(id))
    if (fromPlaylist) {
      dispatch(setWatchCurrentVideo(fromPlaylist))
      return
    }

    dispatch(resetWatch())
    dispatch(getWatchVideo({ id }))
  }, [dispatch, id, playlistItems])

  return null
}
