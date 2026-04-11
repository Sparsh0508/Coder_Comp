import api from "./api";

export async function runSubmission(payload) {
  const { data } = await api.post("/submission/run", payload);
  return data;
}

export async function submitSubmission(payload) {
  const { data } = await api.post("/submission/submit", payload);
  return data;
}
