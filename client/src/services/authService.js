import api from "./api";

export async function registerUser(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function loginUser(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function logoutUser() {
  const { data } = await api.post("/auth/logout");
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function updateProfile(payload) {
  const { data } = await api.put("/auth/profile", payload);
  return data;
}

export async function getWallet() {
  const { data } = await api.get("/auth/wallet");
  return data;
}

export async function depositCoins(payload) {
  const { data } = await api.post("/auth/wallet/deposit", payload);
  return data;
}

export async function createDepositOrder(payload) {
  const { data } = await api.post("/auth/wallet/deposit/order", payload);
  return data;
}

export async function verifyDepositOrder(payload) {
  const { data } = await api.post("/auth/wallet/deposit/verify", payload);
  return data;
}

export async function withdrawCoins(payload) {
  const { data } = await api.post("/auth/wallet/withdraw", payload);
  return data;
}

export async function getSocketToken() {
  const { data } = await api.get("/auth/socket-token");
  return data;
}
