import axios from "axios";
import { API_BASE_URL } from "../config/backend";

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || "Request failed";
    return Promise.reject(
      new ApiError(message, {
        status: error.response?.status,
        data: error.response?.data,
      })
    );
  }
);

export default api;
