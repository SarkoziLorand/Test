export const isTokenExpired = (expiresAt) => {
  return !expiresAt || Date.now() > expiresAt;
};

export const saveAuthToStorage = ({ accessToken, refreshToken, user, expiresAt }) => {
  localStorage.setItem("accessToken", accessToken || "");
  localStorage.setItem("refreshToken", refreshToken || "");
  localStorage.setItem("user", JSON.stringify(user || null));
  localStorage.setItem("expiresAt", String(expiresAt || 0));
};

export const clearAuthStorage = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("expiresAt");
};

export const loadAuthFromStorage = () => {
  try {
    return {
      accessToken: localStorage.getItem("accessToken") || null,
      refreshToken: localStorage.getItem("refreshToken") || null,
      user: JSON.parse(localStorage.getItem("user") || "null"),
      expiresAt: parseInt(localStorage.getItem("expiresAt") || "0", 10),
    };
  } catch {
    return { accessToken: null, refreshToken: null, user: null, expiresAt: 0 };
  }
};
