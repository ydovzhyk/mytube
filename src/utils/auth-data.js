export function getAuthDataFromStorage(store) {
  const state = store.getState();

  if (state?.auth?.accessToken) {
    const { accessToken, sid } = state.auth;
    return { accessToken, sid };
  }

  return null;
}
