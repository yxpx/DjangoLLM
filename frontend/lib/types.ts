export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface Message {
  id: number;
  chat: number;
  user: number;
  content: string;
  image?: string;
  response?: string;
  created_at: string;
}

export interface Chat {
  id: number;
  user: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
  message_count: number;
}

export interface ChatListItem {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message?: string;
}
