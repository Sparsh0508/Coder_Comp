import { createContext, useContext, useEffect, useState } from "react";

import { getCurrentUser, loginUser, logoutUser, registerUser } from "../services/authService";
import { disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((response) => setUser(response.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (payload) => {
    const response = await loginUser(payload);
    setUser(response.user);
    return response;
  };

  const register = async (payload) => {
    const response = await registerUser(payload);
    setUser(response.user);
    return response;
  };

  const logout = async () => {
    await logoutUser();
    disconnectSocket();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
