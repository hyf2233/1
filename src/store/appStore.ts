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
            options: apiResult.options,
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
    for (let i = 0; i < fakeReply.maintext.length; i++) {
      await new Promise(r => setTimeout(r, 25 + Math.random() * 35));
      set(s => ({ streamedText: fakeReply.maintext.slice(0, i + 1) }));
    }

    const aiMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: fakeReply.maintext,
      timestamp: Date.now(),
      parsed: {
        thinking: fakeReply.thinking,
        maintext: fakeReply.maintext,
        options: fakeReply.options,
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

interface ApiReply { thinking: string; maintext: string; options: string[]; sum: string; varsRaw: string; }

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

        // Parse with stream tag parser
        const events = parser.feed(delta);

        for (const ev of events) {
          if (ev.type === 'tag-open') {
            currentDisplayTag = ev.tag;
            if (ev.tag === 'option') {
              // Start collecting options
            }
          } else if (ev.type === 'tag-close') {
            if (ev.tag === 'option') {
              // Options are collected via option-line events
            }
            if (ev.tag === currentDisplayTag) {
              currentDisplayTag = '';
            }
          } else if (ev.type === 'option-line') {
            if (ev.line.trim()) options.push(ev.line.trim());
          } else if (ev.type === 'tag-chunk') {
            if (ev.tag === 'maintext') {
              maintext += ev.chunk;
            }
          }
        }

        // For display during streaming: show maintext only (clean reading experience)
        const displayText = maintext || fullText;
        onStream(displayText, options);
      } catch {
        // Skip malformed SSE lines
      }
    }
  }

  // Final parse of complete response
  const finalEvents = parser.finish();
  // Process any remaining option-line events from finish()
  for (const ev of finalEvents) {
    if (ev.type === 'option-line' && ev.line.trim()) {
      if (!options.includes(ev.line.trim())) options.push(ev.line.trim());
    }
  }

  const aggregated = aggregateEvents([...parser['events'] || [], ...finalEvents]);
  const parsed = parseApiResponse(fullText);

  return {
    thinking: parsed.thinking || aggregated.thinking || '',
    maintext: parsed.maintext || maintext || fullText,
    options: parsed.options.length > 0 ? parsed.options : options,
    sum: parsed.sum || aggregated.sum || '',
    varsRaw: parsed.varsRaw || '',
  };
}

/** Parse raw API response text into structured parts */
function parseApiResponse(raw: string): ApiReply {
  const thinking = extractTag(raw, 'thinking') || extractTag(raw, 'think') || '';
  const maintext = extractTag(raw, 'maintext') || raw.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, '').trim();
  const sum = extractTag(raw, 'sum') || '';
  const varsRaw = extractTag(raw, 'vars') || '';

  const optionTag = extractTag(raw, 'option');
  const options = optionTag
    ? optionTag.split('\n').map(l => l.trim()).filter(Boolean)
    : [];

  return { thinking, maintext, options, sum, varsRaw };
}

function extractTag(text: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
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
    currentOptions: aiMsg.parsed?.options || [],
    lorebooks: historyBook.entries.length === 0
      ? [...s.lorebooks.filter(lb => lb.id !== historyBookId), updatedHistoryBook]
      : s.lorebooks.map(lb => lb.id === historyBookId ? updatedHistoryBook : lb),
    activeLorebookIds: s.activeLorebookIds.includes(historyBookId)
      ? s.activeLorebookIds
      : [...s.activeLorebookIds, historyBookId],
  }));
}

// Tavern-style fallback reply generator
function generateTavernReply(
  userInput: string, characterName: string,
  _activeLorebooks: Lorebook[], matchedEntries: { entry: LorebookEntry; score: number; matchedKeywords: string[] }[],
): { maintext: string; options: string[]; sum: string; thinking: string } {
  const hasWorldContext = matchedEntries.length > 0;
  const worldHints = matchedEntries.slice(0, 3).map(m => m.entry.content.slice(0, 80)).join('; ');

  const replies: Record<string, () => { maintext: string; options: string[]; thinking: string }> = {
    '冒险': () => ({
      thinking: hasWorldContext ? `世界书触发: ${matchedEntries.map(e => e.entry.keys.join(',')).join('; ')}` : '常规冒险回复',
      maintext: `「${characterName}」抬头看向远方，神情认真。\n\n"好。看来你是认真的。遗迹里面不太平，上次我们就遇到了自动防卫机关。${hasWorldContext ? '根据情报——' + worldHints.slice(0, 60) + '——我需要调整行动计划。' : ''}"\n\n她转身展开一张老旧的地图。\n\n"明天正午，北城门集合。别迟到。"\n\n<sum>接受了${characterName}的遗迹探险邀请</sum>\n<vars>{ "HP": 100, "金币": 55, "声望": 15 }</vars>`,
      options: ['没问题，我会准时到', '需要带什么特殊装备？', '先说说报酬怎么分'],
    }),
    '情报|禁术|卷轴': () => ({
      thinking: hasWorldContext ? `情报网络激活: ${matchedEntries.map(e => e.entry.keys.join(',')).join('; ')}` : '情报交易回复',
      maintext: `「${characterName}」压低声音。\n\n"卷轴来自一个叫'沉默之塔'的组织。他们在收集古代符文。目的不明，但肯定不是什么好事。"\n\n${hasWorldContext ? '他扫了一眼周围，继续道："' + worldHints.slice(0, 50) + '——这些信息，我只告诉你一个人。"' : '他扫了一眼周围。'}\n\n"我手上有一份据点分布图。晚上来老地方。带点现金。"\n\n<sum>从${characterName}获取了禁术卷轴情报</sum>\n<vars>{ "金币": 35, "声望": 12 }</vars>`,
      options: ['好，晚上见', '老地方是哪里？', '这份情报需要什么代价？'],
    }),
    '案子|调查|失踪': () => ({
      thinking: '侦探推理场景',
      maintext: `「${characterName}」推了推眼镜，把卷宗推到你面前。\n\n"三起失踪案。共同点：都是异能者，失踪前都收到过一块刻着符文的黑石。${hasWorldContext ? '世界书提示：' + worldHints.slice(0, 60) : ''}"\n\n他顿了顿。\n\n"我怀疑这和'沉默之塔'有关。你觉得呢？"\n\n<sum>接手了${characterName}的失踪案调查</sum>\n<vars>{ "声望": 20, "案件进度": 1 }</vars>`,
      options: ['让我看看那些符文', '我们去调查最后一个失踪者', '先查一下包裹的来源'],
    }),
    '系统|数据|未来|AI': () => ({
      thinking: '第四面墙/元叙事场景',
      maintext: `「${characterName}」的信息在屏幕上闪烁。\n\n"这个世界是一个巨大的数据网络。而我，可以看到网络的底层代码。有人正在改写规则。"\n\n${hasWorldContext ? '根据世界数据——' + worldHints.slice(0, 60) + '——我检测到异常。' : ''}\n\n"48小时内，京海市旧码头会发生一起事件。如果你在场，也许能阻止。"\n\n<sum>云端揭示了世界底层代码的秘密</sum>\n<vars>{ "认知": 25, "声望": 10 }</vars>`,
      options: ['详细说说改写规则的事', '你怎么知道这些的？', '我马上去旧码头'],
    }),
    default: () => ({
      thinking: hasWorldContext ? `世界书匹配: ${matchedEntries.length} 条` : '通用回复',
      maintext: `「${characterName}」沉思片刻。\n\n"嗯...这件事比较复杂。${hasWorldContext ? '让我结合已知信息——' + worldHints.slice(0, 80) + '——来回答你。' : '让我想想从哪里说起。'}"\n\n<sum>与${characterName}的对话继续</sum>`,
      options: ['继续说', '什么事？', '和我有关吗？'],
    }),
  };

  let matchedKey: keyof typeof replies | 'default' = 'default';
  for (const key of Object.keys(replies)) {
    if (key === 'default') continue;
    if (new RegExp(key, 'i').test(userInput)) { matchedKey = key as keyof typeof replies; break; }
  }

  const result = replies[matchedKey]();
  return { ...result, sum: extractSum(result.maintext) };
}

function extractSum(text: string): string {
  const match = text.match(/<sum>(.+?)<\/sum>/);
  return match ? match[1] : '剧情推进';
}
