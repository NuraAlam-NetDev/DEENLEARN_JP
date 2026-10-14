import axios from 'axios';

// In dev, leave VITE_API_URL empty: Vite proxies /api to the Express server,
// so cookies are same-origin. In production set it to the API's URL.
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});
// AuthContext registers a callback here so a dead session logs the user out of the UI
let onSessionExpired = () => {};
export const setSessionExpiredHandler = (fn) => {
  onSessionExpired = fn;
};

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];
let refreshPromise = null; // shared, so parallel 401s trigger only ONE refresh

// Access token lasts ~15 min. When a request fails with 401, refresh once and retry it.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isAuthCall = AUTH_PATHS.some((p) => config?.url?.includes(p));

    if (!response || response.status !== 401 || !config || config._retry || isAuthCall) {
      return Promise.reject(error);
    }
    config._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = api.post('/auth/refresh').finally(() => {
          refreshPromise = null;
        });
      }
      await refreshPromise;
      return api(config); // retry the original request with the fresh cookie
    } catch {
      onSessionExpired();
      return Promise.reject(error);
    }
  }
);

export function getErrorMessage(error) {
  if (!error?.response) return 'Cannot reach the server. Is it running?';
  const data = error.response.data;
  if (data?.errors?.length) return data.errors.map((e) => e.message).join('. ');
  return data?.message || error.message || 'Something went wrong';
}

// Server validation errors -> { fieldName: message }, so forms can show them next to the field
export function getFieldErrors(error) {
  const list = error?.response?.data?.errors;
  if (error?.response?.status !== 400 || !Array.isArray(list)) return {};
  return Object.fromEntries(list.filter((e) => e.field).map((e) => [e.field, e.message]));
}

export default api;
