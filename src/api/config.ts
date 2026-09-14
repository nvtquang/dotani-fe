export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  chatWsUrl: import.meta.env.VITE_CHAT_WS_URL ?? 'ws://localhost:8080/ws/chat',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
};
