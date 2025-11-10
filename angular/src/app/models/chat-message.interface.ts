export interface ChatMessage {
  id?: string;
  text: string;
  userId: string;
  userEmail: string;
  userName?: string;
  timestamp: number;
  createdAt: string;
}

export interface ChatRoom {
  id?: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  lastMessage?: ChatMessage;
  participantCount?: number;
}