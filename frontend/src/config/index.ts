// Configuration for API and external services
export const config = {
  // API base URL for backend services
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  
  // Stream server URL for watching streams
  streamServerUrl: import.meta.env.VITE_STREAM_SERVER_URL || 'http://localhost:8888',
} as const

// Helper function to get stream watch URL
export const getStreamWatchUrl = (streamId: string | number): string => {
  return `${config.streamServerUrl}/stream/${streamId}`
}
