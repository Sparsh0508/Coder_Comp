import axios from "axios";

const runnerApi = axios.create({
  baseURL: "https://coder-comp-jxv5.onrender.com/api",
});

export default runnerApi;