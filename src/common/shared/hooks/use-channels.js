const MOCK_SUBSCRIBED_CHANNELS = [
  {
    id: 'ch-1',
    handle: 'tech-insider',
    bio: 'Tech news and reviews',
    avatarPath: null,
    bannerPath: null,
    ownerId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    owner: {
      id: 'user-1',
      name: 'Tech Insider',
      email: 'tech@example.com',
    },
    videosCount: 150,
    followersCount: 25000,
    isSubscribed: true,
  },
  {
    id: 'ch-2',
    handle: 'code-master',
    bio: 'Programming tutorials',
    avatarPath: null,
    bannerPath: null,
    ownerId: 'user-2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    owner: {
      id: 'user-2',
      name: 'Code Master',
      email: 'code@example.com',
    },
    videosCount: 200,
    followersCount: 50000,
    isSubscribed: true,
  },
  {
    id: 'ch-3',
    handle: 'design-daily',
    bio: 'UI/UX design tips',
    avatarPath: null,
    bannerPath: null,
    ownerId: 'user-3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    owner: {
      id: 'user-3',
      name: 'Design Daily',
      email: 'design@example.com',
    },
    videosCount: 80,
    followersCount: 15000,
    isSubscribed: true,
  },
]

export function useChannel(handle) {
  const channel = MOCK_SUBSCRIBED_CHANNELS.find((ch) => ch.handle === handle)
  return {
    data: channel,
    isLoading: false,
    error: null,
  }
}

export function useMyChannels() {
  return {
    data: MOCK_SUBSCRIBED_CHANNELS,
    isLoading: false,
    error: null,
  }
}
