import runnerApi from "./runnerApi";

export async function runSubmission(payload) {
  const { data } = await runnerApi.post("/run", payload);
  return data;
}

export async function submitSubmission(payload) {
  const { data } = await runnerApi.post("/submit", payload);
  return data;
}