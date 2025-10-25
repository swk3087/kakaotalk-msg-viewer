
// Add type declaration for the JSZip library loaded from CDN
// FIX: Wrap in `declare global` because this file is a module. This makes JSZip available globally.
declare global {
  var JSZip: any;
}

export interface User {
  name: string;
  avatarUrl?: string;
  isMe: boolean;
  avatarColor: string;
}

export interface Message {
  id: number;
  type: 'message';
  user: string;
  content: string;
  timestamp: string;
  isContinuation: boolean;
}

export interface DateSeparator {
  id: number;
  type: 'date';
  date: string;
}

export interface SystemMessage {
  id: number;
  type: 'system';
  content: string;
}

export type ChatItem = Message | DateSeparator | SystemMessage;
