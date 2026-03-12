// API base URL helper — uses environment variable VITE_API_BASE or fallback to production URL
export const API_BASE = import.meta.env.VITE_API_BASE || 'https://simple-marketplace-api.onrender.com/api'
