import { createContext, useState, useCallback } from "react";
import axios from "axios";

export const AuthContext = createContext();

const API = "http://localhost:4000";

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(
    () => sessionStorage.getItem("accessToken") || null
  );
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const login = async (username, password) => {
    const res = await axios.post(`${API}/auth/login`, { username, password });
    const { accessToken, refreshToken } = res.data;
    setAccessToken(accessToken);
    sessionStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    setUser({ id: payload.id, username: payload.username });
    sessionStorage.setItem("user", JSON.stringify({ id: payload.id, username: payload.username }));
  };

  const register = async (username, email, password) => {
    await axios.post(`${API}/auth/register`, { username, email, password });
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    sessionStorage.clear();
    localStorage.removeItem("refreshToken");
  };

  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("No refresh token");
    const res = await axios.post(`${API}/auth/refresh`, { refreshToken });
    setAccessToken(res.data.accessToken);
    sessionStorage.setItem("accessToken", res.data.accessToken);
    return res.data.accessToken;
  }, []);

  const authAxios = useCallback(async (config) => {
    try {
      return await axios({ ...config, headers: { ...config.headers, Authorization: `Bearer ${accessToken}` } });
    } catch (err) {
      if (err.response?.status === 401) {
        const newToken = await refreshAccessToken();
        return axios({ ...config, headers: { ...config.headers, Authorization: `Bearer ${newToken}` } });
      }
      throw err;
    }
  }, [accessToken, refreshAccessToken]);

  return (
    <AuthContext.Provider value={{ accessToken, user, login, register, logout, authAxios }}>
      {children}
    </AuthContext.Provider>
  );
};
