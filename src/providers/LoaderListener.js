'use client'

import { useSelector } from 'react-redux'
import Loader from '@/common/shared/loader/Loader'
import { getLoadingAuth, getIsRefreshing } from '@/store/auth/auth-selectors'
import { getChannelLoading } from '@/store/channel/channel-selectors'
import { getVideosLoading } from '@/store/videos/videos-selectors'
import { getTechnicalLoading } from '../store/technical/technical-selectors'

export default function LoaderListener() {
  const authLoading = useSelector(getLoadingAuth)
  const isRefreshing = useSelector(getIsRefreshing)
  const channelLoading = useSelector(getChannelLoading)
  const technicalLoading = useSelector(getTechnicalLoading)
  const videosLoading = useSelector(getVideosLoading)

  const isGlobalLoading =
    authLoading || isRefreshing || channelLoading || technicalLoading || videosLoading

  if (!isGlobalLoading) return null
  return <Loader />
}
