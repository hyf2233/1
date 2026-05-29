// src/store/appStore.ts
import { create } from 'zustand';
import type { TabId, Contact, ChatSession, ChatMessage, Moment, BranchPoint } from '../types';
import type { AppSettings, ChatPreset, Lorebook } from '../sillytavern/types';
import { DEFAULT_SETTINGS, createDefaultPreset } from '../sillytavern/types';
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

    // Simulate LLM streaming with fake reply generator
    const fakeReply = generateFakeReply(content, chat.contactId);
    for (let i = 0; i < fakeReply.maintext.length; i++) {
      await new Promise(r => setTimeout(r, 30 + Math.random() * 40));
      set(s => ({ streamedText: fakeReply.maintext.slice(0, i + 1) }));
    }

    const aiMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: fakeReply.maintext,
      timestamp: Date.now(),
      parsedTags: {
        maintext: fakeReply.maintext,
        options: fakeReply.options,
        sum: fakeReply.sum,
      },
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

// Fake reply generator for prototyping
function generateFakeReply(_input: string, contactId: string): { maintext: string; options: string[]; sum: string } {
  const replies: Record<string, { maintext: string; options: string[] }> = {
    c1: {
      maintext: '好。看来你是认真的。那我就直说了——遗迹里面不太平，上次我们就遇到了自动防卫机关。\n\n如果你决定了要加入，明天带好装备，正午之前到北城门集合。',
      options: ['没问题，我会准时到', '需要带什么特殊装备？', '先说说报酬怎么分'],
    },
    c2: {
      maintext: '卷轴来自一个叫"沉默之塔"的组织。他们在收集古代符文。目的不明，但肯定不是什么好事。\n\n我手上有一份他们的据点分布图。想要的话，晚上来老地方。',
      options: ['好，晚上见', '老地方是哪里？', '这份情报需要什么代价？'],
    },
    c5: {
      maintext: '卷宗在这里。三起失踪案的共同点：都是异能者，都在失踪前收到过一个匿名包裹。包裹里是一块刻着符文的黑石。\n\n我怀疑这和"沉默之塔"有关。你觉得呢？',
      options: ['让我看看那些符文', '我们去调查最后一个失踪者', '先查一下包裹的来源'],
    },
    c10: {
      maintext: '这个世界是一个巨大的数据网络。而我，可以看到网络的底层代码。有人正在改写规则。\n\n48小时内，京海市旧码头会发生一起事件。如果你在场，也许能阻止一些事情。',
      options: ['详细说说改写规则的事', '你怎么知道这些的？', '我马上去旧码头'],
    },
    default: {
      maintext: '嗯...这件事比较复杂。让我想想从哪里说起。\n\n总之，最近京海市发生了一些不寻常的事情。我觉得你应该知道。',
      options: ['继续说', '什么事？', '和我有关吗？'],
    },
  };
  const r = replies[contactId] ?? replies.default;
  return { ...r, sum: '剧情推进' };
}
