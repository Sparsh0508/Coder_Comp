/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from "react";

import {
  createDepositOrder as createDepositOrderRequest,
  depositCoins as depositCoinsRequest,
  getCurrentUser,
  getSocketToken,
  getWallet as getWalletRequest,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile as updateProfileRequest,
  verifyDepositOrder as verifyDepositOrderRequest,
  withdrawCoins as withdrawCoinsRequest,
} from "../services/authService";
import { disconnectSocket, getSocket } from "../services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionNotice, setSessionNotice] = useState("");
  const hasLoadedUserRef = useRef(false);

  useEffect(() => {
    if (hasLoadedUserRef.current) {
      return;
    }

    hasLoadedUserRef.current = true;

    getCurrentUser()
      .then((response) => setUser(response.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const socket = getSocket();
    let isActive = true;

    async function connectSocket() {
      try {
        const response = await getSocketToken();
        socket.auth = { token: response.token };
        socket.io.opts.query = { token: response.token };
      } catch {
        return;
      }

      if (!socket.connected) {
        socket.connect();
      }
    }

    const handleSessionInvalidated = (payload) => {
      const message = payload?.message || "Your account has been logged in on another device.";
      if (!isActive) {
        return;
      }
      window.sessionStorage.setItem("session_notice", message);
      setSessionNotice(message);
      disconnectSocket();
      setUser(null);
    };

    connectSocket();
    socket.on("sessionInvalidated", handleSessionInvalidated);

    return () => {
      isActive = false;
      socket.off("sessionInvalidated", handleSessionInvalidated);
    };
  }, [user]);

  const refreshUser = async () => {
    const response = await getCurrentUser();
    setUser(response.user);
    return response.user;
  };

  const login = async (payload) => {
    const response = await loginUser(payload);
    disconnectSocket();
    setUser(response.user);
    return response;
  };

  const register = async (payload) => {
    const response = await registerUser(payload);
    disconnectSocket();
    setUser(response.user);
    return response;
  };

  const logout = async () => {
    await logoutUser();
    disconnectSocket();
    setUser(null);
  };

  const consumeSessionNotice = () => {
    const stored = window.sessionStorage.getItem("session_notice");
    if (stored) {
      window.sessionStorage.removeItem("session_notice");
      setSessionNotice("");
      return stored;
    }
    if (sessionNotice) {
      setSessionNotice("");
      return sessionNotice;
    }
    return "";
  };

  const updateUser = (patch) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  };

  const updateProfile = async (payload) => {
    const response = await updateProfileRequest(payload);
    setUser(response.user);
    return response;
  };

  const getWallet = async () => {
    return getWalletRequest();
  };

  const depositCoins = async (payload) => {
    const response = await depositCoinsRequest(payload);
    setUser(response.user);
    return response;
  };

  const createDepositOrder = async (payload) => {
    return createDepositOrderRequest(payload);
  };

  const verifyDepositOrder = async (payload) => {
    const response = await verifyDepositOrderRequest(payload);
    setUser(response.user);
    return response;
  };

  const withdrawCoins = async (payload) => {
    const response = await withdrawCoinsRequest(payload);
    setUser(response.user);
    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        updateProfile,
        getWallet,
        depositCoins,
        createDepositOrder,
        verifyDepositOrder,
        withdrawCoins,
        sessionNotice,
        consumeSessionNotice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
