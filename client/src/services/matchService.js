import api from "./api";

export async function findMatch(payload) {
  const { data } = await api.post("/match/find", payload);
  return data;
}

export async function leaveQueue() {
  const { data } = await api.post("/match/leave");
  return data;
}

export async function getMatchById(matchId) {
  const { data } = await api.get(`/match/${matchId}`);
  return data;
}
