// import axios from "axios";
// import { env } from "../config/env";
// export const api = axios.create({ baseURL: env.apiUrl, timeout: 15000 });
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("smartride-token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });
// api.interceptors.response.use(
//   (response) => response.data.data,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem("smartride-token");
//       localStorage.removeItem("smartride-user");
//       if (location.pathname !== "/login") location.assign("/login");
//     }
//     return Promise.reject(
//       new Error(error.response?.data?.message || "Something went wrong"),
//     );
//   },
// );




import axios from "axios";
import { env } from "../config/env";

export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("smartride-token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log("API Request:", config.baseURL + config.url);

  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log("API Success:", response.status);
    console.log("API Response Data:", response.data);

    return response.data.data;
  },
  (error) => {
    console.error("API Error:", error.message);
    console.error("Request URL:", error.config?.url);
    console.error("Base URL:", error.config?.baseURL);
    console.error("Status:", error.response?.status);
    console.error("Backend Response:", error.response?.data);

    if (error.response?.status === 401) {
      localStorage.removeItem("smartride-token");
      localStorage.removeItem("smartride-user");

      if (location.pathname !== "/login") {
        location.assign("/login");
      }
    }

    return Promise.reject(
      new Error(
        error.response?.data?.message ||
        error.message ||
        "Something went wrong"
      )
    );
  }
);