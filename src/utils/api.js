// API base URL helper — uses vite proxy in development to avoid CORS
export const API_BASE = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_BASE || '/api')
