import axios, { AxiosInstance } from "axios";

// Небольшой хелпер для создания axios-клиента с admin key.
export function createApiClient(adminKey: string | null): AxiosInstance {
  const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const instance = axios.create({ baseURL });

  instance.interceptors.request.use((config) => {
    if (!config.headers) {
      config.headers = {};
    }
    if (adminKey) {
      config.headers["X-Admin-Key"] = adminKey;
    }
    return config;
  });

  return instance;
}
