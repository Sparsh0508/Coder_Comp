import api from "./api";

export async function fetchLeaderboard() {
  const { data } = await api.get("/leaderboard");
  return data;
}
