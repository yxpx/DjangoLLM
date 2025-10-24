// Resolve API base URL dynamically to avoid localhost/127.0.0.1 cookie mismatches in dev.
// Priority: NEXT_PUBLIC_API_URL > window.hostname:8000 (client) > http://localhost:8000 (SSR)
const DEFAULT_API_BASE =
  typeof window !== 'undefined'
    ? `http://${window.location.hostname}:8000`
    : 'http://localhost:8000';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE;

export const api = {
  // Auth endpoints
  async login(username: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },

  async register(username: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/api/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },

  async logout() {
    const res = await fetch(`${API_BASE_URL}/api/auth/logout/`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/api/auth/me/`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  // Chat endpoints
  async getChats() {
    const res = await fetch(`${API_BASE_URL}/api/chats/`, {
      credentials: 'include',
    });
    return res.json();
  },

  async createChat(title = 'New Chat') {
    const res = await fetch(`${API_BASE_URL}/api/chats/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title }),
    });
    return res.json();
  },

  async getChat(chatId: number) {
    const res = await fetch(`${API_BASE_URL}/api/chats/${chatId}/`, {
      credentials: 'include',
    });
    return res.json();
  },

  async updateChat(chatId: number, title: string) {
    const res = await fetch(`${API_BASE_URL}/api/chats/${chatId}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title }),
    });
    return res.json();
  },

  async deleteChat(chatId: number) {
    const res = await fetch(`${API_BASE_URL}/api/chats/${chatId}/`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return res.ok;
  },

  async sendMessage(
    chatId: number,
    content: string,
    image?: File,
    signal?: AbortSignal
  ) {
    const formData = new FormData();
    formData.append('content', content);
    if (image) {
      formData.append('image', image);
    }

    const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/message/`, {
      method: 'POST',
      credentials: 'include',
      signal,
      body: formData,
    });

    return response.body;
  },
};
