// src/store/appStore.ts
import { create } from 'zustand';
import type { TabId, Contact, ChatSession, ChatMessage, Moment, BranchPoint } from '../types';
import type { AppSettings, ChatPreset, Lorebook, LorebookEntry } from '../sillytavern/types';
import { DEFAULT_SETTINGS, createDefaultPreset, DEFAULT_FORMAT_PROMPT } from '../sillytavern/types';
import { assemblePrompt } from '../sillytavern/prompt-assembler';
import { createLorebookEngine } from '../sillytavern/lorebook-engine';
import { createDefaultEntry } from '../sillytavern/editor-utils';
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
  sendMessage: (content: string) => Promise<void>;
  isStreaming: boolean;
  streamedText: string;
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
  setActiveChat: (id) => set({ activeChatId: id, showHistoryDrawer: false }),

  isStreaming: false,
  streamedText: '',
  currentOptions: [],

  sendMessage: async (content: string) => {
    const chat = get().activeChat();
    if (!chat) return;
    const { settings, presets, activePresetId, lorebooks, activeLorebookIds, contacts } = get();

    const contact = contacts.find(c => c.id === chat.contactId);
    const activePreset = presets.find(p => p.id === activePresetId) || presets[0];
    if (!activePreset) return;

    const activeLorebooks = lorebooks.filter(lb => activeLorebookIds.includes(lb.id));
    const presetSettings = activePreset.settings;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const updatedChat = {
      ...chat,
      messages: [...chat.messages, userMsg],
      updatedAt: Date.now(),
    };

    set(s => ({
      chats: s.chats.map(c => c.id === chat.id ? updatedChat : c),
      isStreaming: true,
      streamedText: '',
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
          (streamedMaintext, options) => {
            set(s => ({ streamedText: streamedMaintext, currentOptions: options }));
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

        finalizeMessage(get, set, chat, updatedChat, aiMsg, content, characterName, apiResult.sum);
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
    const displayText = fakeReply.chats.map(c => c.content).join('');
    for (let i = 0; i < displayText.length; i++) {
      await new Promise(r => setTimeout(r, 25 + Math.random() * 35));
      set(s => ({ streamedText: displayText.slice(0, i + 1) }));
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

    finalizeMessage(get, set, chat, updatedChat, aiMsg, content, characterName, fakeReply.sum);
  },

  chooseOption: async (option: string) => {
    await get().sendMessage(option);
  },

  deleteMessage: (chatId, messageId) => set(s => ({
    chats: s.chats.map(c => c.id === chatId
      ? { ...c, messages: c.messages.filter(m => m.id !== messageId), updatedAt: Date.now() }
      : c
    ),
  })),

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
    const truncated = { ...chat, messages: chat.messages.slice(0, idx + 1), updatedAt: Date.now() };
    set(s => ({ chats: s.chats.map(c => c.id === chat.id ? truncated : c) }));
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
  removeLorebook: (id) => set((st) => ({ lorebooks: st.lorebooks.filter((b) => b.id !== id), activeLorebookIds: st.activeLorebookIds.filter((aid) => aid !== id) })),
  toggleActiveLorebook: (id) => set((st) => ({
    activeLorebookIds: st.activeLorebookIds.includes(id)
      ? st.activeLorebookIds.filter((aid) => aid !== id)
      : [...st.activeLorebookIds, id],
  })),
  updateLorebook: (lb) => set((st) => ({ lorebooks: st.lorebooks.map((b) => (b.id === lb.id ? lb : b)) })),

  // SillyTavern Presets
  presets: [{ ...createDefaultPreset(), id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now() }],
  activePresetId: null,
  addPreset: (p) => set((st) => ({ presets: [...st.presets, p] })),
  removePreset: (id) => set((st) => ({ presets: st.presets.filter((p) => p.id !== id), activePresetId: st.activePresetId === id ? null : st.activePresetId })),
  setActivePreset: (id) => set({ activePresetId: id }),
  updatePreset: (p) => set((st) => ({ presets: st.presets.map((pr) => (pr.id === p.id ? p : pr)) })),
}));

// ========== Helper Functions ==========

import type { ChatEntry } from '../sillytavern/types';
interface ApiReply { thinking: string; maintext: string; chats: ChatEntry[]; sum: string; varsRaw: string; }

/** Make a real API call with SSE streaming */
async function callRealApi(
  baseUrl: string, apiKey: string, model: string,
  messages: { role: string; content: string }[],
  presetSettings: Record<string, any>,
  customTags: string[],
  onStream: (maintext: string, options: string[]) => void,
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
  const options: string[] = [];

  // Track current tag context for display filtering
  let currentDisplayTag = '';

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

        onStream(maintext || fullText, []);
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

  // Extract all <chat> tags with type attributes
  const chats: ApiReply['chats'] = [];
  const chatRegex = /<chat\s+type="(\w+)"(?:\s+duration="(\d+)")?>([\s\S]*?)<\/chat>/gi;
  let m;
  while ((m = chatRegex.exec(raw)) !== null) {
    chats.push({
      type: (m[1] as ChatEntry['type']) || 'text',
      content: m[3].trim(),
      duration: m[2] ? Number(m[2]) : undefined,
    });
  }

  // Fallback: extract <chat> without attributes
  if (chats.length === 0) {
    const simpleChatRegex = /<chat>([\s\S]*?)<\/chat>/gi;
    while ((m = simpleChatRegex.exec(raw)) !== null) {
      chats.push({ type: 'text', content: m[1].trim() });
    }
  }

  const maintext = chats.map(c => c.content).join('\n') || raw.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, '').trim();

  // Strip sum and vars from maintext (they go to world book, not chat display)
  const cleanMaintext = maintext.replace(/<sum>[^>]*[\s\S]*?<\/sum>/gi, '').replace(/<vars>[^>]*[\s\S]*?<\/vars>/gi, '').trim();
  return { thinking, maintext: cleanMaintext, chats, sum, varsRaw };
}

function extractTag(text: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

/** Finalize the message: add AI message, record history, update state */
function finalizeMessage(
  get: () => AppState, set: any,
  chat: ChatSession, updatedChat: ChatSession,
  aiMsg: ChatMessage, userContent: string,
  characterName: string, summary: string,
) {
  const finalChat = {
    ...updatedChat,
    messages: [...updatedChat.messages, aiMsg],
    updatedAt: Date.now(),
  };

  const historyBookId = `lb-history-${chat.contactId}`;
  const historyBooks = get().lorebooks;
  let historyBook = historyBooks.find(lb => lb.id === historyBookId);
  if (!historyBook) {
    historyBook = {
      id: historyBookId,
      name: `对话记录 - ${characterName}`,
      description: `与${characterName}的对话历史摘要。用于帮助AI记住之前的对话。`,
      recursiveScanning: false, caseSensitive: false, matchWholeWords: false,
      createdAt: Date.now(), updatedAt: Date.now(),
      entries: [],
    };
  }

  const se = createDefaultEntry();
  se.keys = ['对话', '历史', '之前', '上次', '回顾', characterName, '聊天记录'];
  se.content = `【对话记录 - ${new Date().toLocaleString('zh-CN')}】
用户说："${userContent.slice(0, 80)}"
${characterName}的回应摘要：${summary || '对话继续'}`;
  se.order = Date.now();
  se.constant = false;
  se.position = 'after_char';

  const updatedHistoryBook = {
    ...historyBook,
    entries: [...historyBook.entries.slice(-19), se],
    updatedAt: Date.now(),
  };

  set((s: AppState) => ({
    chats: s.chats.map(c => c.id === chat.id ? finalChat : c),
    isStreaming: false,
    streamedText: '',
    currentOptions: [],
    lorebooks: historyBook.entries.length === 0
      ? [...s.lorebooks.filter(lb => lb.id !== historyBookId), updatedHistoryBook]
      : s.lorebooks.map(lb => lb.id === historyBookId ? updatedHistoryBook : lb),
    activeLorebookIds: s.activeLorebookIds.includes(historyBookId)
      ? s.activeLorebookIds
      : [...s.activeLorebookIds, historyBookId],
  }));
}

// Tavern-style fallback reply generator — chat format
function generateTavernReply(
  userInput: string, characterName: string,
  _activeLorebooks: Lorebook[], matchedEntries: { entry: LorebookEntry; score: number; matchedKeywords: string[] }[],
): { chats: ChatEntry[]; sum: string; thinking: string } {
  const hasWorldContext = matchedEntries.length > 0;

  const replies: Record<string, () => { chats: { type: string; content: string; duration?: number }[]; thinking: string }> = {
    '冒险|遗迹': () => ({
      thinking: hasWorldContext ? `世界书触发: ${matchedEntries.map(e => e.entry.keys.join(',')).join('; ')}` : '冒险话题',
      chats: [
        { type: 'text', content: '在！刚在看北境遗迹的资料 📖' },
        { type: 'text', content: '你上次不是说想一起去吗？我查到新线索了' },
        { type: 'voice', content: '那个古代符文的位置我基本确定了。在北城门往西三公里的废弃矿洞里。不过这地方有点危险，上次有人进去后失踪了。你考虑清楚要不要来。', duration: 15 },
        { type: 'text', content: '不过去之前你得准备几样东西：手电筒、登山鞋、还有……勇气 😄' },
      ],
    }),
    '情报|禁术|卷轴': () => ({
      thinking: '情报话题',
      chats: [
        { type: 'text', content: '嘘...这事不方便打字说' },
        { type: 'voice', content: '那个卷轴来自一个叫沉默之塔的组织。他们在收集古代符文，目的不明。我手上有一份他们的据点分布图。晚上来老地方，我详细跟你说。', duration: 18 },
        { type: 'text', content: '对了，带点现金。不是开玩笑。' },
      ],
    }),
    '案子|调查|失踪': () => ({
      thinking: '案件话题',
      chats: [
        { type: 'text', content: '你可算找我了' },
        { type: 'text', content: '老城区那个失踪案，我又查到了一些东西' },
        { type: 'image', content: '[图片] 失踪者最后出现的地点——旧码头监控截图' },
        { type: 'text', content: '三个失踪者都收到过一块刻着符文的黑石。我怀疑和沉默之塔有关。你怎么看？' },
      ],
    }),
    '视频|见面|约': () => ({
      thinking: '视频通话',
      chats: [
        { type: 'text', content: '打字太慢了，方便视频吗？' },
        { type: 'video', content: '（视频接通）你看这个——我刚从旧货市场淘到的古籍。封面的符文和北境遗迹的一模一样。这书起码有三百年历史了。', duration: 35 },
        { type: 'text', content: '怎么样？明天有空的话我带去给你看实物' },
      ],
    }),
    default: () => ({
      thinking: hasWorldContext ? `世界书匹配: ${matchedEntries.length} 条` : '通用回复',
      chats: [
        { type: 'text', content: `嗯嗯，我在的` },
        { type: 'text', content: `最近京海市出了不少事，你听说了吗？` },
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

function extractSum(text: string): string {
  const match = text.match(/<sum>(.+?)<\/sum>/);
  return match ? match[1] : '对话继续';
}
