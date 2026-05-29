// src/types/index.ts
import type { ChatSession as STChatSession } from '../sillytavern/types';

// Re-export SillyTavern types
export type { ChatMessage, ChatPreset, Lorebook, LorebookEntry, AppSettings, ApiSettings, ParsedTags } from '../sillytavern/types';

// Extended ChatSession with WeChat-specific contactId
export interface ChatSession extends STChatSession {
  contactId: string;
}

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
