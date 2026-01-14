export const getLogin = ({ auth }) => auth.isLogin;
export const getIsRefreshing = ({ auth }) => auth.isRefreshing;
export const getSid = ({ auth }) => auth.sid;
export const getAccessToken = ({ auth }) => auth.accessToken;
export const getUser = ({ auth }) => auth.user;
export const getLoadingAuth = ({ auth }) => auth.loading;
export const getAuthError = ({ auth }) => auth.error;
export const getAuthMessage = ({ auth }) => auth.message;
