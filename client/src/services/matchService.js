import api from "./api";

export async function findMatch(payload) {
  const { data } = await api.post("/match/find", payload);
  return data;
}

export async function leaveQueue(payload = {}) {
  const { data } = await api.post("/match/leave", payload);
  return data;
}

export async function getMatchById(matchId) {
  const { data } = await api.get(`/match/${matchId}`);
  return data;
}

export async function getActiveMatch() {
  const { data } = await api.get("/match/active/current");
  return data;
}

export async function timeoutMatch(matchId) {
  const { data } = await api.post(`/match/${matchId}/timeout`);
  return data;
}

export async function forfeitMatch(matchId) {
  const { data } = await api.post(`/match/${matchId}/forfeit`);
  return data;
}
