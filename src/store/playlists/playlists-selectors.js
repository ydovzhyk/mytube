export const getPlaylistsLoading = ({ playlists }) => playlists.loading
export const getPlaylistsError = ({ playlists }) => playlists.error
export const getPlaylistsMessage = ({ playlists }) => playlists.message

export const getSearchPlaylistsItems = ({ playlists }) => playlists.search.items
export const getSearchPlaylistsTotal = ({ playlists }) => playlists.search.total
export const getSearchPlaylistsPage = ({ playlists }) => playlists.search.page
export const getSearchPlaylistsLimit = ({ playlists }) => playlists.search.limit
export const getSearchPlaylistsTotalPages = ({ playlists }) => playlists.search.totalPages
export const getSearchPlaylistsQuery = ({ playlists }) => playlists.search.q
