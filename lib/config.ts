/**
 * Centralised runtime config.
 * - NEXT_PUBLIC_API_URL is set to the Render backend URL in production.
 * - Falls back to localhost for local development.
 */
export const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
