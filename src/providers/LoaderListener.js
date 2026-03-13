'use client'

import { useSelector } from 'react-redux'
import Loader from '@/common/shared/loader/Loader'
import { getLoadingAuth, getIsRefreshing } from '@/store/auth/auth-selectors'
import { getChannelsLoading } from '@/store/channel/channel-selectors'
import { getVideosLoading } from '@/store/videos/videos-selectors'
import { getTechnicalLoading } from '@/store/technical/technical-selectors'
import { getPlaylistsLoading } from '@/store/playlists/playlists-selectors'
import { getMyPlaylistsLoading } from '@/store/my-playlists/my-playlists-selectors'

export default function LoaderListener() {
  const authLoading = useSelector(getLoadingAuth)
  const isRefreshing = useSelector(getIsRefreshing)
  const channelsLoading = useSelector(getChannelsLoading)
  const technicalLoading = useSelector(getTechnicalLoading)
  const videosLoading = useSelector(getVideosLoading)
  const playlistsLoading = useSelector(getPlaylistsLoading)
  const myPlaylistsLoading = useSelector(getMyPlaylistsLoading)

  const isGlobalLoading =
    authLoading || isRefreshing || channelsLoading || technicalLoading || videosLoading || playlistsLoading || myPlaylistsLoading

  if (!isGlobalLoading) return null
  return <Loader />
}
