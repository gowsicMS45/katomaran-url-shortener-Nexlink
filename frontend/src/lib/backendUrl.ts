/**
 * Returns the backend base URL.
 * In production: uses VITE_API_URL env variable (set in Vercel).
 * In development: falls back to localhost:5000.
 */
export const BACKEND_BASE_URL: string = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL as string)
  : 'http://localhost:5000';
