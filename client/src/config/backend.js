const DEFAULT_BACKEND_URL = "https://coder-comp-server.onrender.com";
const DEFAULT_RUNNER_URL = "https://coder-comp-jxv5.onrender.com";
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function normalizeUrl(value) {
  return value?.trim().replace(/\/$/, "");
}

function isLoopbackUrl(value) {
  try {
    return LOOPBACK_HOSTS.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

function resolvePublicUrl(value, fallback) {
  const url = normalizeUrl(value);

  if (!url) {
    return fallback;
  }

  if (import.meta.env.PROD && isLoopbackUrl(url)) {
    return fallback;
  }

  return url;
}

export const BACKEND_URL = DEFAULT_BACKEND_URL;
export const API_BASE_URL = resolvePublicUrl(import.meta.env.VITE_API_URL, `${DEFAULT_BACKEND_URL}/api`);
export const SOCKET_URL = resolvePublicUrl(import.meta.env.VITE_SOCKET_URL, DEFAULT_BACKEND_URL);
export const RUNNER_URL = DEFAULT_RUNNER_URL;
