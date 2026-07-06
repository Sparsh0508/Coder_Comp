import runnerApi from "./runnerApi";

export async function runSubmission(payload) {
  const { data } = await runnerApi.post("/submission/run", payload);
  return data;
}

export async function submitSubmission(payload) {
  const { data } = await runnerApi.post("/submission/submit", payload);
  return data;
}