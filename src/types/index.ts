// src/types/index.ts
export interface Contact {
  id: string;
  name: string;
  avatar: string;
  avatarType: 'gradient' | 'image';
  bio?: string;
  phone?: string;
  tags?: string[];
  region?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  online: boolean;
  pinned: boolean;
  unreadCount: number;
  muted: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  parsedTags?: ParsedTags;
  optionChosen?: string;
}

export interface ParsedTags {
  maintext: string;
  options: string[];
  sum?: string;
}

export interface ChatSession {
  id: string;
  contactId: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface Moment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  images?: string[];
  likes: string[];
  comments: MomentComment[];
  createdAt: string;
  location?: string;
}

export interface MomentComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  replyTo?: string;
  createdAt: string;
}

export interface GameState {
  variables: Record<string, number | string>;
  branchHistory: BranchPoint[];
}

export interface BranchPoint {
  messageId: string;
  timestamp: number;
  variables: Record<string, number | string>;
}

export type TabId = 'chat' | 'contacts' | 'moments' | 'discover' | 'profile';

export interface TabDefinition {
  id: TabId;
  label: string;
  icon: string;
}
