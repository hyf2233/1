// src/store/appStore.ts
import { create } from 'zustand';
import type { TabId, Contact, ChatSession, ChatMessage, Moment, BranchPoint } from '../types';
import type { AppSettings, ChatPreset, Lorebook, LorebookEntry, ChatEntry } from '../sillytavern/types';
import { DEFAULT_SETTINGS, createDefaultPreset, DEFAULT_FORMAT_PROMPT } from '../sillytavern/types';
import { assemblePrompt } from '../sillytavern/prompt-assembler';
import { createLorebookEngine } from '../sillytavern/lorebook-engine';
import { createDefaultEntry, chatEntriesToXml, parseChatEntriesFromXml } from '../sillytavern/editor-utils';
import { StreamTagParser } from '../sillytavern/stream-parser';
import { aggregateEvents } from '../sillytavern/variables';
import { DEFAULT_TAGS, DEFAULT_OPAQUE_TAGS } from '../sillytavern/types';
import { presetContacts } from '../data/contacts';
import { presetMoments } from '../data/moments';
import { presetChats } from '../data/chats';
import { presetLorebooks } from '../data/lorebooks';

interface AppState {
  // Navigation
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // Contacts
  contacts: Contact[];
  getContact: (id: string) => Contact | undefined;
  updateContact: (id: string, patch: Partial<Contact>) => void;

  // Chats
  chats: ChatSession[];
  activeChatId: string | null;
  activeChat: () => ChatSession | null;
  setActiveChat: (id: string | null) => void;
  sendMessage: (content: string, chatEntryOverride?: ChatEntry) => Promise<void>;
  isStreaming: boolean;
  streamedText: string;
  streamedChats: ChatEntry[];
  currentOptions: string[];
  chooseOption: (option: string) => Promise<void>;
  deleteMessage: (chatId: string, messageId: string) => void;

  // Moments
  moments: Moment[];
  addMoment: (moment: Moment) => void;
  likeMoment: (id: string) => void;
  addComment: (momentId: string, comment: Moment['comments'][0]) => void;

  // Game state
  gameState: Record<string, number | string>;
  branchHistory: BranchPoint[];
  backtrackTo: (messageId: string) => void;

  // UI
  showHistoryDrawer: boolean;
  toggleHistoryDrawer: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;

  // SillyTavern Settings
  settings: AppSettings;
  updateSettings: (s: AppSettings) => void;

  // SillyTavern Lorebooks
  lorebooks: Lorebook[];
  activeLorebookIds: string[];
  addLorebook: (lb: Lorebook) => void;
  removeLorebook: (id: string) => void;
  toggleActiveLorebook: (id: string) => void;
  updateLorebook: (lb: Lorebook) => void;

  // SillyTavern Presets
  presets: ChatPreset[];
  activePresetId: string | null;
  addPreset: (p: ChatPreset) => void;
  removePreset: (id: string) => void;
  setActivePreset: (id: string) => void;
  updatePreset: (p: ChatPreset) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: 'chat',
  setActiveTab: (tab) => set({ activeTab: tab }),

  contacts: presetContacts,
  getContact: (id) => get().contacts.find(c => c.id === id),
  updateContact: (id, patch) => set(s => ({
    contacts: s.contacts.map(c => c.id === id ? { ...c, ...patch } : c),
  })),

  chats: presetChats,
  activeChatId: null,
  activeChat: () => {
    const { chats, activeChatId } = get();
    return chats.find(c => c.id === activeChatId) ?? null;
  },
  setActiveChat: (id) => {
    if (!id) {
      set({ activeChatId: null, showHistoryDrawer: false });
      return;
    }
    // Ensure history lorebook exists for this chat
    const state = get();
    const chat = state.chats.find(c => c.id === id);
    if (chat) {
      const historyBookId = `lb-history-${chat.contactId}`;
      const hasHistoryBook = state.lorebooks.some(lb => lb.id === historyBookId);
      if (!hasHistoryBook) {
        const contact = state.contacts.find(c => c.id === chat.contactId);
        const charName = contact?.name || chat.characterName || 'AI';
        const userName = state.settings.userName || '用户';
        const entries = chat.messages.map(msg =>
          messageToLorebookEntry(msg, userName, charName),
        );
        const newBook: Lorebook = {
          id: historyBookId,
          name: `💬 对话记录 - ${charName}`,
          description: `与「${charName}」的完整对话记录。AI 会读取这些记录来了解对话历史。`,
          recursiveScanning: false, caseSensitive: false, matchWholeWords: false,
          createdAt: Date.now(), updatedAt: Date.now(),
          entries,
        };
        set(s => ({
          activeChatId: id,
          showHistoryDrawer: false,
          lorebooks: [...s.lorebooks, newBook],
          activeLorebookIds: s.activeLorebookIds.includes(historyBookId)
            ? s.activeLorebookIds
            : [...s.activeLorebookIds, historyBookId],
        }));
        return;
      }
    }
    set({ activeChatId: id, showHistoryDrawer: false });
  },

  isStreaming: false,
  streamedText: '',
  streamedChats: [],
  currentOptions: [],

  sendMessage: async (content: string, chatEntryOverride?: ChatEntry) => {
    const chat = get().activeChat();
    if (!chat) return;
    const { settings, presets, activePresetId, lorebooks, activeLorebookIds, contacts } = get();

    const contact = contacts.find(c => c.id === chat.contactId);
    const activePreset = presets.find(p => p.id === activePresetId) || presets[0];
    if (!activePreset) return;

    const activeLorebooks = lorebooks.filter(lb => activeLorebookIds.includes(lb.id));
    const presetSettings = activePreset.settings;

    // Build user message — support typed messages via chatEntryOverride
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: chatEntryOverride ? chatEntryOverride.content : content,
      timestamp: Date.now(),
    };

    // If user sent a typed message (voice, video, etc.), store parsed.chats
    if (chatEntryOverride && chatEntryOverride.type !== 'text') {
      userMsg.parsed = {
        thinking: '',
        maintext: content,
        options: [],
        chats: [chatEntryOverride],
        sum: '',
        varsRaw: '',
        varsCommands: { merge: get().gameState },
        unknown: {},
      };
    }

    const updatedChat = {
      ...chat,
      messages: [...chat.messages, userMsg],
      updatedAt: Date.now(),
    };

    set(s => ({
      chats: s.chats.map(c => c.id === chat.id ? updatedChat : c),
      isStreaming: true,
      streamedText: '',
      streamedChats: [],
      currentOptions: [],
    }));

    const userName = settings.userName || '用户';
    const characterName = contact?.name || settings.characterName || 'AI';

    const { messages: promptMessages, matchedEntries } = assemblePrompt({
      userInput: content,
      history: chat.messages,
      preset: activePreset,
      lorebooks: activeLorebooks,
      userName,
      characterName,
      variables: chat.variables || get().gameState,
      formatPrompt: settings.formatPromptTemplate || DEFAULT_FORMAT_PROMPT,
    });

    // If API key is configured, make a real API call
    const hasApiKey = settings.api.apiKey && settings.api.apiKey.trim().length > 0;

    if (hasApiKey) {
      try {
        const apiResult = await callRealApi(
          settings.api.baseUrl, settings.api.apiKey, settings.api.model,
          promptMessages, presetSettings, settings.customTags,
          (streamedMaintext, streamedChats, options) => {
            set(s => ({ streamedText: streamedMaintext, streamedChats: [...streamedChats], currentOptions: options }));
          },
        );

        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: apiResult.maintext,
          timestamp: Date.now(),
          parsed: {
            thinking: apiResult.thinking,
            maintext: apiResult.maintext,
            options: [],
            chats: apiResult.chats,
            sum: apiResult.sum,
            varsRaw: apiResult.varsRaw,
            varsCommands: { merge: get().gameState },
            unknown: {},
          },
          variablesAfter: { ...get().gameState },
        };

        finalizeAndSync(get, set, chat, updatedChat, aiMsg, characterName);
        return;
      } catch (err: any) {
        const errMsg = err.message || String(err);
        set(s => ({
          isStreaming: false,
          streamedText: '',
          toastMessage: `API 调用失败: ${errMsg.slice(0, 80)}`,
        }));
        return;
      }
    }

    // Fallback: simulated tavern-style response
    const fakeReply = generateTavernReply(content, characterName, activeLorebooks, matchedEntries);
    const displayText = fakeReply.chats.map(c => c.content).join('\n');
    // Stream in text chunks, revealing chat entries one at a time
    const allChats = fakeReply.chats;
    let shownChats = 0;
    let charIdx = 0;
    const totalChars = displayText.length;

    while (charIdx < totalChars) {
      await new Promise(r => setTimeout(r, 25 + Math.random() * 35));
      charIdx = Math.min(charIdx + 1, totalChars);

      // Determine which chats are "complete" based on characters consumed
      let consumedChars = 0;
      let completeChats = 0;
      for (const chat of allChats) {
        consumedChars += chat.content.length + 1; // +1 for newline
        if (charIdx >= consumedChars) {
          completeChats++;
        } else {
          break;
        }
      }
      shownChats = Math.max(shownChats, completeChats);

      set(s => ({
        streamedText: displayText.slice(0, charIdx),
        streamedChats: allChats.slice(0, shownChats),
      }));
    }

    const aiMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: displayText,
      timestamp: Date.now(),
      parsed: {
        thinking: fakeReply.thinking,
        maintext: displayText,
        options: [],
        chats: fakeReply.chats,
        sum: fakeReply.sum,
        varsRaw: '',
        varsCommands: { merge: get().gameState },
        unknown: {},
      },
      variablesAfter: { ...get().gameState },
    };

    finalizeAndSync(get, set, chat, updatedChat, aiMsg, characterName);
  },

  chooseOption: async (option: string) => {
    await get().sendMessage(option);
  },

  deleteMessage: (chatId, messageId) => set(s => {
    const chat = s.chats.find(c => c.id === chatId);
    if (!chat) return {};

    // Remove from chat messages
    const updatedChats = s.chats.map(c => c.id === chatId
      ? { ...c, messages: c.messages.filter(m => m.id !== messageId), updatedAt: Date.now() }
      : c
    );

    // Also remove from history lorebook
    const historyBookId = `lb-history-${chat.contactId}`;
    const updatedLorebooks = s.lorebooks.map(lb => {
      if (lb.id !== historyBookId) return lb;
      return {
        ...lb,
        entries: lb.entries.filter(e => e.comment !== messageId),
        updatedAt: Date.now(),
      };
    });

    return { chats: updatedChats, lorebooks: updatedLorebooks };
  }),

  moments: presetMoments,
  addMoment: (moment) => set(s => ({ moments: [moment, ...s.moments] })),
  likeMoment: (id) => set(s => ({
    moments: s.moments.map(m =>
      m.id === id
        ? { ...m, likes: m.likes.includes('user') ? m.likes.filter(l => l !== 'user') : [...m.likes, 'user'] }
        : m
    ),
  })),
  addComment: (momentId, comment) => set(s => ({
    moments: s.moments.map(m =>
      m.id === momentId ? { ...m, comments: [...m.comments, comment] } : m
    ),
  })),

  gameState: { HP: 100, 金币: 50, 声望: 10 },
  branchHistory: [],
  backtrackTo: (messageId) => {
    const chat = get().activeChat();
    if (!chat) return;
    const idx = chat.messages.findIndex(m => m.id === messageId);
    if (idx === -1) return;
    // Also clean up lorebook entries after the backtrack point
    const removedIds = chat.messages.slice(idx + 1).map(m => m.id);
    const historyBookId = `lb-history-${chat.contactId}`;
    const truncated = { ...chat, messages: chat.messages.slice(0, idx + 1), updatedAt: Date.now() };
    set(s => ({
      chats: s.chats.map(c => c.id === chat.id ? truncated : c),
      lorebooks: s.lorebooks.map(lb => {
        if (lb.id !== historyBookId) return lb;
        return {
          ...lb,
          entries: lb.entries.filter(e => !removedIds.includes(e.comment || '')),
          updatedAt: Date.now(),
        };
      }),
    }));
  },

  showHistoryDrawer: false,
  toggleHistoryDrawer: () => set(s => ({ showHistoryDrawer: !s.showHistoryDrawer })),

  toastMessage: null,
  showToast: (msg) => set({ toastMessage: msg }),
  clearToast: () => set({ toastMessage: null }),

  // SillyTavern Settings
  settings: DEFAULT_SETTINGS,
  updateSettings: (s) => set({ settings: s }),

  // SillyTavern Lorebooks
  lorebooks: presetLorebooks,
  activeLorebookIds: ['lb-format-spec'],
  addLorebook: (lb) => set((st) => ({ lorebooks: [...st.lorebooks, lb] })),
  removeLorebook: (id) => set((st) => ({
    lorebooks: st.lorebooks.filter((b) => b.id !== id),
    activeLorebookIds: st.activeLorebookIds.filter((aid) => aid !== id),
  })),
  toggleActiveLorebook: (id) => set((st) => ({
    activeLorebookIds: st.activeLorebookIds.includes(id)
      ? st.activeLorebookIds.filter((aid) => aid !== id)
      : [...st.activeLorebookIds, id],
  })),
  updateLorebook: (lb) => set((st) => {
    // Check if this is a history lorebook → sync entries back to chat
    const isHistoryBook = lb.id.startsWith('lb-history-');
    let updatedChats = st.chats;

    if (isHistoryBook) {
      const contactId = lb.id.replace('lb-history-', '');
      const chat = st.chats.find(c => c.contactId === contactId);
      if (chat) {
        updatedChats = rebuildChatFromLorebook(st.chats, chat.id, lb);
      }
    }

    return {
      lorebooks: st.lorebooks.map((b) => (b.id === lb.id ? lb : b)),
      chats: updatedChats,
    };
  }),

  // SillyTavern Presets
  presets: [{ ...createDefaultPreset(), id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now() }],
  activePresetId: null,
  addPreset: (p) => set((st) => ({ presets: [...st.presets, p] })),
  removePreset: (id) => set((st) => ({
    presets: st.presets.filter((p) => p.id !== id),
    activePresetId: st.activePresetId === id ? null : st.activePresetId,
  })),
  setActivePreset: (id) => set({ activePresetId: id }),
  updatePreset: (p) => set((st) => ({ presets: st.presets.map((pr) => (pr.id === p.id ? p : pr)) })),
}));

// ========== Helper Functions ==========

interface ApiReply { thinking: string; maintext: string; chats: ChatEntry[]; sum: string; varsRaw: string; }

/** Make a real API call with SSE streaming */
async function callRealApi(
  baseUrl: string, apiKey: string, model: string,
  messages: { role: string; content: string }[],
  presetSettings: Record<string, any>,
  customTags: string[],
  onStream: (maintext: string, chats: ChatEntry[], options: string[]) => void,
): Promise<ApiReply> {
  const url = baseUrl.replace(/\/+$/, '') + '/chat/completions';
  const stream = presetSettings.stream_openai !== false;

  const body: Record<string, any> = {
    model: model || presetSettings.openai_model || 'gpt-3.5-turbo',
    messages,
    stream,
  };
  if (presetSettings.temp_openai !== undefined) body.temperature = presetSettings.temp_openai;
  if (presetSettings.openai_max_tokens) body.max_tokens = presetSettings.openai_max_tokens;
  if (presetSettings.top_p_openai !== undefined) body.top_p = presetSettings.top_p_openai;
  if (presetSettings.freq_pen_openai !== undefined) body.frequency_penalty = presetSettings.freq_pen_openai;
  if (presetSettings.pres_pen_openai !== undefined) body.presence_penalty = presetSettings.pres_pen_openai;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${errText.slice(0, 200)}`);
  }

  if (!stream) {
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || '';
    return parseApiResponse(raw);
  }

  // SSE streaming
  const parser = new StreamTagParser(customTags.length ? customTags : [...DEFAULT_TAGS], [...DEFAULT_OPAQUE_TAGS]);
  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';
  let maintext = '';
  const streamedChats: ChatEntry[] = [];
  const options: string[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') continue;

      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (!delta) continue;

        fullText += delta;
        const events = parser.feed(delta);

        for (const ev of events) {
          if (ev.type === 'chat-entry') {
            const entry: ChatEntry = {
              type: (ev.chatType as ChatEntry['type']) || 'text',
              content: ev.content || '',
              duration: ev.duration,
              amount: ev.amount,
              transferNote: ev.transferNote,
              fileName: ev.fileName,
              fileSize: ev.fileSize,
              address: ev.address,
              lat: ev.lat,
              lng: ev.lng,
              time: ev.time,
            };
            streamedChats.push(entry);
            const chatText = ev.content || '';
            if (chatText.trim()) {
              maintext += (maintext ? '\n' : '') + chatText;
            }
          } else if (ev.type === 'tag-chunk') {
            if (ev.tag === 'chat') {
              maintext += ev.chunk;
            }
          }
        }

        onStream(maintext || fullText, streamedChats, []);
      } catch {
        // Skip malformed SSE lines
      }
    }
  }

  // Final parse
  const finalEvents = parser.finish();
  const allEvents = [...parser.collectedEvents, ...finalEvents];
  const aggregated = aggregateEvents(allEvents);
  const parsed = parseApiResponse(fullText);

  return {
    thinking: parsed.thinking || aggregated.thinking || '',
    maintext: aggregated.chats.map(c => c.content).join('\n') || fullText,
    chats: aggregated.chats.length > 0 ? aggregated.chats : parsed.chats,
    sum: parsed.sum || aggregated.sum || '',
    varsRaw: parsed.varsRaw || '',
  };
}

/** Parse raw API response text into structured parts */
function parseApiResponse(raw: string): ApiReply {
  const thinking = extractTag(raw, 'thinking') || extractTag(raw, 'think') || '';
  const sum = extractTag(raw, 'sum') || '';
  const varsRaw = extractTag(raw, 'vars') || '';

  const chats: ApiReply['chats'] = [];
  const chatRegex = /<chat\s+type="(\w+)"(?:\s+duration="(\d+)")?(?:\s+time="([^"]*)")?(?:\s+amount="([\d.]+)")?(?:\s+note="([^"]*)")?(?:\s+filename="([^"]*)")?(?:\s+filesize="([^"]*)")?(?:\s+address="([^"]*)")?(?:\s+lat="([\d.]+)")?(?:\s+lng="([\d.]+)")?>([\s\S]*?)<\/chat>/gi;
  let m;
  while ((m = chatRegex.exec(raw)) !== null) {
    const type = (m[1] as ChatEntry['type']) || 'text';
    const entry: ChatEntry = {
      type,
      content: (m[11] || '').trim(),
      duration: m[2] ? Number(m[2]) : undefined,
      time: m[3] || undefined,
      amount: m[4] ? Number(m[4]) : undefined,
      transferNote: m[5] || undefined,
      fileName: m[6] || undefined,
      fileSize: m[7] || undefined,
      address: m[8] || undefined,
      lat: m[9] ? Number(m[9]) : undefined,
      lng: m[10] ? Number(m[10]) : undefined,
    };
    chats.push(entry);
  }

  if (chats.length === 0) {
    const simpleChatRegex = /<chat>([\s\S]*?)<\/chat>/gi;
    while ((m = simpleChatRegex.exec(raw)) !== null) {
      chats.push({ type: 'text', content: m[1].trim() });
    }
  }

  const maintext = chats.map(c => c.content).join('\n') || raw.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, '').trim();
  const cleanMaintext = maintext.replace(/<sum>[^>]*[\s\S]*?<\/sum>/gi, '').replace(/<vars>[^>]*[\s\S]*?<\/vars>/gi, '').trim();
  return { thinking, maintext: cleanMaintext, chats, sum, varsRaw };
}

function extractTag(text: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

// ========== History Lorebook Sync ==========

/**
 * Called after a new AI message is generated.
 * 1. Adds AI message to chat
 * 2. Syncs ALL messages of this chat to the history lorebook
 */
function finalizeAndSync(
  get: () => AppState, set: any,
  chat: ChatSession, updatedChat: ChatSession,
  aiMsg: ChatMessage, characterName: string,
) {
  const finalChat = {
    ...updatedChat,
    messages: [...updatedChat.messages, aiMsg],
    updatedAt: Date.now(),
  };

  // Build the history lorebook from all messages
  const userName = get().settings.userName || '用户';
  const contact = get().contacts.find(c => c.id === chat.contactId);
  const charName = contact?.name || characterName;
  const historyBookId = `lb-history-${chat.contactId}`;

  // Build entries for all messages
  const messageEntries: LorebookEntry[] = finalChat.messages.map(msg => {
    return messageToLorebookEntry(msg, userName, charName);
  });

  // Find or create the history book
  let historyBook = get().lorebooks.find(lb => lb.id === historyBookId);
  if (historyBook) {
    // Preserve manually-added entries (entries without a comment linking to a chat message)
    const manualEntries = historyBook.entries.filter(e => !e.comment);
    historyBook = {
      ...historyBook,
      entries: [...messageEntries, ...manualEntries],
      updatedAt: Date.now(),
    };
  } else {
    historyBook = {
      id: historyBookId,
      name: `💬 对话记录 - ${charName}`,
      description: `与「${charName}」的完整对话记录。这些条目会自动提供给 AI 作为上下文。你可以编辑、删除或手动添加条目，修改会实时反映到聊天界面。`,
      recursiveScanning: false,
      caseSensitive: false,
      matchWholeWords: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      entries: messageEntries,
    };
  }

  set((s: AppState) => {
    const lorebookExists = s.lorebooks.some(lb => lb.id === historyBookId);
    const historyActive = s.activeLorebookIds.includes(historyBookId);

    return {
      chats: s.chats.map(c => c.id === chat.id ? finalChat : c),
      isStreaming: false,
      streamedText: '',
      streamedChats: [],
      currentOptions: [],
      lorebooks: lorebookExists
        ? s.lorebooks.map(lb => lb.id === historyBookId ? historyBook : lb)
        : [...s.lorebooks, historyBook],
      activeLorebookIds: historyActive
        ? s.activeLorebookIds
        : [...s.activeLorebookIds, historyBookId],
    };
  });
}

/**
 * Convert a chat message to a lorebook entry.
 * The entry stores all information needed to reconstruct the message.
 */
function messageToLorebookEntry(
  msg: ChatMessage,
  userName: string,
  characterName: string,
): LorebookEntry {
  const isUser = msg.role === 'user';
  const roleName = isUser ? userName : characterName;
  const roleEmoji = isUser ? '👤' : '🤖';
  const timeStr = new Date(msg.timestamp).toLocaleString('zh-CN');

  // Build header with metadata
  const header = `【${roleEmoji} ${roleName} · ${timeStr}】`;

  // Store chat entries as re-parseable XML so types survive lorebook roundtrip
  let contentBody = msg.content;
  if (msg.parsed?.chats && msg.parsed.chats.length > 0) {
    // Has explicit parsed chat entries → serialize to XML
    contentBody = chatEntriesToXml(msg.parsed.chats, '\n');
  } else {
    // Try to parse content as XML — if it already contains <chat> tags, preserve them
    const parsed = parseChatEntriesFromXml(msg.content);
    if (parsed.length > 0) {
      // Content already has XML chat entries, keep in XML format
      contentBody = chatEntriesToXml(parsed, '\n');
    }
  }

  const entry = createDefaultEntry();
  entry.id = `he-${msg.id}`;
  entry.keys = [
    roleName,
    isUser ? 'role-user' : 'role-assistant',
    '对话', '聊天记录', '历史',
  ];
  entry.content = `${header}\n${contentBody}`;
  entry.comment = msg.id;  // Links to chat message ID
  entry.order = msg.timestamp;
  entry.constant = true;
  entry.position = 'after_char';
  entry.probability = 100;
  entry.selective = false;
  entry.selectiveLogic = 'and_any';

  return entry;
}

/**
 * Rebuild chat messages from a history lorebook.
 * Used when the user edits the lorebook through the LorebookEditor.
 */
function rebuildChatFromLorebook(
  chats: ChatSession[],
  chatId: string,
  lorebook: Lorebook,
): ChatSession[] {
  return chats.map(chat => {
    if (chat.id !== chatId) return chat;

    // Get entries sorted by order (timestamp)
    const sortedEntries = [...lorebook.entries].sort((a, b) => a.order - b.order);

    // Build messages from linked entries (those with comment = messageId)
    const rebuiltMessages: ChatMessage[] = [];
    const seenIds = new Set<string>();

    for (const entry of sortedEntries) {
      const msgId = entry.comment;

      if (msgId) {
        // This entry is linked to a specific chat message
        const existingMsg = chat.messages.find(m => m.id === msgId);
        const body = extractBodyFromEntry(entry);
        const role = extractRoleFromEntry(entry);
        // Try to parse XML chat entries from the body
        const parsedChats = parseChatEntriesFromXml(body);

        if (existingMsg) {
          const updated: ChatMessage = { ...existingMsg, role };
          if (parsedChats.length > 0) {
            updated.content = parsedChats.map(c => c.content).join('\n');
            updated.parsed = {
              thinking: existingMsg.parsed?.thinking || '',
              maintext: updated.content,
              options: [],
              chats: parsedChats,
              sum: existingMsg.parsed?.sum || '',
              varsRaw: existingMsg.parsed?.varsRaw || '',
              varsCommands: existingMsg.parsed?.varsCommands || { merge: {} },
              unknown: existingMsg.parsed?.unknown || {},
            };
          } else {
            updated.content = body;
          }
          rebuiltMessages.push(updated);
        } else {
          // Restore from lorebook
          const restored: ChatMessage = {
            id: msgId,
            role,
            content: parsedChats.length > 0 ? parsedChats.map(c => c.content).join('\n') : body,
            timestamp: entry.order || Date.now(),
          };
          if (parsedChats.length > 0) {
            restored.parsed = {
              thinking: '',
              maintext: restored.content,
              options: [],
              chats: parsedChats,
              sum: '',
              varsRaw: '',
              varsCommands: { merge: {} },
              unknown: {},
            };
          }
          rebuiltMessages.push(restored);
        }
        seenIds.add(msgId);
      } else {
        // Manual entry (no comment) → create as new assistant message
        const newId = entry.id;
        if (seenIds.has(newId)) continue;
        seenIds.add(newId);

        const body = extractBodyFromEntry(entry);
        const parsedChats = parseChatEntriesFromXml(body);

        const existing = chat.messages.find(m => m.id === newId);
        if (existing) {
          const updated: ChatMessage = { ...existing };
          if (parsedChats.length > 0) {
            updated.content = parsedChats.map(c => c.content).join('\n');
            updated.parsed = {
              thinking: existing.parsed?.thinking || '',
              maintext: updated.content,
              options: [],
              chats: parsedChats,
              sum: existing.parsed?.sum || '',
              varsRaw: existing.parsed?.varsRaw || '',
              varsCommands: existing.parsed?.varsCommands || { merge: {} },
              unknown: existing.parsed?.unknown || {},
            };
          } else {
            updated.content = body;
          }
          rebuiltMessages.push(updated);
        } else {
          const newMsg: ChatMessage = {
            id: newId,
            role: 'assistant',
            content: parsedChats.length > 0 ? parsedChats.map(c => c.content).join('\n') : body,
            timestamp: entry.order || Date.now(),
          };
          if (parsedChats.length > 0) {
            newMsg.parsed = {
              thinking: '',
              maintext: newMsg.content,
              options: [],
              chats: parsedChats,
              sum: '',
              varsRaw: '',
              varsCommands: { merge: {} },
              unknown: {},
            };
          }
          rebuiltMessages.push(newMsg);
        }
      }
    }

    // The lorebook IS the source of truth for history books.
    // Messages not represented in the lorebook are dropped.
    // Sort by timestamp for display
    rebuiltMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    return { ...chat, messages: rebuiltMessages, updatedAt: Date.now() };
  });
}

/** Extract the body content from a lorebook entry (strip header line, preserve XML) */
function extractBodyFromEntry(entry: LorebookEntry): string {
  const lines = entry.content.split('\n');
  // Skip the metadata header line (starts with 【)
  if (lines.length > 1 && lines[0].startsWith('【')) {
    const body = lines.slice(1).join('\n').trim();
    // If body starts with <chat, it's XML — return as-is
    return body;
  }
  return entry.content.trim();
}

/** Extract message role from lorebook entry keys */
function extractRoleFromEntry(entry: LorebookEntry): 'user' | 'assistant' {
  return entry.keys.includes('role-user') ? 'user' : 'assistant';
}

// ========== Tavern-style Fallback Reply ==========

function generateTavernReply(
  userInput: string, characterName: string,
  _activeLorebooks: Lorebook[], matchedEntries: { entry: LorebookEntry; score: number; matchedKeywords: string[] }[],
): { chats: ChatEntry[]; sum: string; thinking: string } {
  const hasWorldContext = matchedEntries.length > 0;
  const baseTime = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (offsetMin: number) =>
    `${pad(baseTime.getHours())}:${pad(baseTime.getMinutes() + Math.floor(offsetMin))}`;

  const replies: Record<string, () => { chats: ChatEntry[]; thinking: string }> = {
    '冒险|遗迹': () => ({
      thinking: hasWorldContext ? `世界书触发: ${matchedEntries.map(e => e.entry.keys.join(',')).join('; ')}` : '冒险话题',
      chats: [
        { type: 'text', content: '在！刚在看北境遗迹的资料', time: fmt(0) },
        { type: 'text', content: '你上次不是说想一起去吗？我查到一个新线索', time: fmt(0) },
        { type: 'location', address: '京海市北城门西3公里废弃矿洞', lat: 39.92, lng: 116.40, content: '遗迹入口大概在这个位置', time: fmt(1) },
        { type: 'voice', content: '那个古代符文的位置我基本确定了。在北城门往西三公里的废弃矿洞里。不过这地方有点危险，上次有人进去后失踪了。你考虑清楚要不要来。', duration: 15, time: fmt(2) },
        { type: 'document', fileName: '遗迹装备清单.pdf', fileSize: '156KB', content: '我整理了一份装备清单', time: fmt(3) },
        { type: 'text', content: '不过去之前你得准备几样东西：手电筒、登山鞋、还有勇气', time: fmt(3) },
      ],
    }),
    '情报|禁术|卷轴': () => ({
      thinking: '情报话题',
      chats: [
        { type: 'text', content: '嘘...这事不方便打字说', time: fmt(0) },
        { type: 'voice', content: '那个卷轴来自一个叫沉默之塔的组织。他们在收集古代符文，目的不明。我手上有一份他们的据点分布图。晚上来老地方，我详细跟你说。', duration: 18, time: fmt(1) },
        { type: 'transfer', amount: 500, transferNote: '情报费', content: '情报的费用你先收着', time: fmt(2) },
        { type: 'text', content: '对了，带点现金。不是开玩笑。', time: fmt(2) },
      ],
    }),
    '案子|调查|失踪': () => ({
      thinking: '案件话题',
      chats: [
        { type: 'text', content: '你可算找我了', time: fmt(0) },
        { type: 'text', content: '老城区那个失踪案，我又查到了一些东西', time: fmt(0) },
        { type: 'image', content: '失踪者最后出现的地点——旧码头监控截图', time: fmt(1) },
        { type: 'document', fileName: '失踪案调查报告.pdf', fileSize: '3.2MB', content: '这是我整理的案情分析', time: fmt(2) },
        { type: 'text', content: '三个失踪者都收到过一块刻着符文的黑石。我怀疑和沉默之塔有关。你怎么看？', time: fmt(2) },
      ],
    }),
    '视频|见面|约': () => ({
      thinking: '视频通话',
      chats: [
        { type: 'text', content: '打字太慢了，方便视频吗？', time: fmt(0) },
        { type: 'video', content: '你看这个——我刚从旧货市场淘到的古籍。封面的符文和北境遗迹的一模一样。这书起码有三百年历史了。', duration: 35, time: fmt(1) },
        { type: 'location', address: '京海市老城区晨曦侦探社', lat: 39.9042, lng: 116.4074, content: '我在侦探社，你过来吧', time: fmt(2) },
        { type: 'text', content: '怎么样？明天有空的话我带去给你看实物', time: fmt(2) },
      ],
    }),
    default: () => ({
      thinking: hasWorldContext ? `世界书匹配: ${matchedEntries.length} 条` : '通用回复',
      chats: [
        { type: 'text', content: `嗯嗯，我在的`, time: fmt(0) },
        { type: 'text', content: `最近京海市出了不少事，你听说了吗？`, time: fmt(0) },
      ],
    }),
  };

  let matchedKey: keyof typeof replies | 'default' = 'default';
  for (const key of Object.keys(replies)) {
    if (key === 'default') continue;
    if (new RegExp(key, 'i').test(userInput)) { matchedKey = key as keyof typeof replies; break; }
  }

  const result = replies[matchedKey]();
  return { ...result, chats: result.chats as ChatEntry[], sum: `与${characterName}的对话` };
}
