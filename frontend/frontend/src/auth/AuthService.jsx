// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  isTokenExpired,
  saveAuthToStorage,
  clearAuthStorage,
  loadAuthFromStorage,
} from "../utils/tokenUtils";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const baseUrl = "http://localhost:8080/api"
  const [auth, setAuth] = useState(() => loadAuthFromStorage());

  const isAuthenticated = !!auth.accessToken;

  const setSession = (data) => {
    const { accessToken, refreshToken, user, accessExp } = data;
    const expiresAt = accessExp * 1000;

    const newAuth = { accessToken, refreshToken, user, expiresAt };
    saveAuthToStorage(newAuth);
    setAuth(newAuth);
  };

  const clearSession = () => {
    clearAuthStorage();
    setAuth({ accessToken: null, refreshToken: null, user: null, expiresAt: 0 });
  };

  const login = async (email, password, remember = false) => {
    try {
      const res = await fetch(baseUrl + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) return false;

      const data = await res.json();

      setSession(data);

      if (!remember) {
        localStorage.removeItem("refreshToken");
      }

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch(baseUrl + "/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
    } catch {}
    clearSession();
    navigate("/login", { replace: true });
  };

  const tryRefresh = async () => {
    const refreshToken = auth.refreshToken;
    if (!refreshToken) return false;

    try {
      const res = await fetch(baseUrl + "/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        clearSession();
        return false;
      }

      const data = await res.json();
      setSession(data);

      return true;
    } catch (err) {
      clearSession();
      return false;
    }
  };

  const getValidAccessToken = useCallback(async () => {
    if (!auth.accessToken || isTokenExpired(auth.expiresAt)) {
      const refreshed = await tryRefresh();
      return refreshed ? loadAuthFromStorage().accessToken : null;
    }
    return auth.accessToken;
  }, [auth]);

  const authFetch = useCallback(
    async (path, options = {}) => {
      const token = await getValidAccessToken();
      if (!token) {
        logout();
        return null;
      }

      const headers = new Headers(options.headers || {});
      headers.set("Authorization", `Bearer ${token}`);
      console.log(path);
      const response = await fetch(baseUrl + path, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        const refreshed = await tryRefresh();
        if (refreshed) {
          console.log("am ajuns aici si n ar trebuie :)");
          return await authFetch(path, options); 
        } else {
          logout();
        }
      }

      return response;
    },
    [getValidAccessToken]
  );

  return (
    <AuthContext.Provider
      value={{
        auth,
        isAuthenticated,
        login,
        logout,
        getValidAccessToken,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
