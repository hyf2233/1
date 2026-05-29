// src/store/appStore.ts
import { create } from 'zustand';
import type { TabId, Contact, ChatSession, ChatMessage, Moment, BranchPoint } from '../types';
import type { AppSettings, ChatPreset, Lorebook, LorebookEntry } from '../sillytavern/types';
import { DEFAULT_SETTINGS, createDefaultPreset, DEFAULT_FORMAT_PROMPT } from '../sillytavern/types';
import { assemblePrompt } from '../sillytavern/prompt-assembler';
import { createLorebookEngine } from '../sillytavern/lorebook-engine';
import { presetContacts } from '../data/contacts';
import { presetMoments } from '../data/moments';
import { presetChats } from '../data/chats';

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

    // Build SillyTavern prompt with lorebooks
    const userName = settings.userName || '用户';
    const characterName = contact?.name || settings.characterName || 'AI';

    const { systemPrompt, matchedEntries } = assemblePrompt({
      userInput: content,
      history: chat.messages,
      preset: activePreset,
      lorebooks: activeLorebooks,
      userName,
      characterName,
      variables: chat.variables || get().gameState,
      formatPrompt: settings.formatPromptTemplate || DEFAULT_FORMAT_PROMPT,
    });

    // Simulate AI response in SillyTavern XML format
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

    const finalChat = {
      ...updatedChat,
      messages: [...updatedChat.messages, aiMsg],
      updatedAt: Date.now(),
    };

    set(s => ({
      chats: s.chats.map(c => c.id === chat.id ? finalChat : c),
      isStreaming: false,
      streamedText: '',
      currentOptions: fakeReply.options,
    }));
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
  lorebooks: [],
  activeLorebookIds: [],
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

// Tavern-style reply generator: produces XML-tagged responses aware of active lorebooks
function generateTavernReply(
  userInput: string, characterName: string,
  activeLorebooks: Lorebook[], matchedEntries: { entry: LorebookEntry; score: number; matchedKeywords: string[] }[],
): { maintext: string; options: string[]; sum: string; thinking: string } {

  // Inject world book context into the character's response style
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
