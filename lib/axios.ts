import axios from "axios";

const api = axios.create();

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const oldRefreshToken = localStorage.getItem("refreshToken");

      try {
        const res = await axios.post("/api/auth/refresh", {
          refreshToken: oldRefreshToken,
        });

        const { accessToken, refreshToken } = res.data;
        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
