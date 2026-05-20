// API base URL helper — uses environment variable VITE_API_BASE or fallback to production URL
const API_BASE_VALUE = import.meta.env.VITE_API_BASE || 'https://simple-marketplace-api.onrender.com/api'

export const API_BASE = API_BASE_VALUE

// Resolve origin for SignalR hub URLs without assuming the API path suffix.
export const API_ORIGIN = (() => {
	try {
		return new URL(API_BASE_VALUE, window.location.origin).origin
	} catch (err) {
		return API_BASE_VALUE.replace(/\/(api|api2)\/?$/i, '')
	}
})()
