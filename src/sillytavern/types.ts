/**
 * SillyTavern Web - Core Types
 */

// ========== World Book (Lorebook) Types ==========

export interface LorebookEntry {
  id: string;
  keys: string[];
  secondaryKeys: string[];
  content: string;
  comment?: string;
  order: number;
  /** SillyTavern position: 0=before_char, 1=after_char, 2=before_example(AN top), 3=after_example(AN bottom), 4=at_depth, 5=example_msg_top, 6=example_msg_bottom, 7=outlet */
  position: 'before_char' | 'after_char' | 'before_example' | 'after_example' | 'at_depth' | 'example_msg_top' | 'example_msg_bottom' | 'outlet';
  depth?: number;
  role?: number;
  selective: boolean;
  /** 0=and_any(not_any?), 1=or(not_all?), actual SillyTavern has 4 logics but we normalize to and/or where possible */
  selectiveLogic: 'and_any' | 'not_all' | 'not_any' | 'and_all';
  constant: boolean;
  probability: number;
  useProbability?: boolean;
  addMemo: boolean;
  sticky?: number;
  cooldown?: number;
  delay?: number;
  weight?: number;
  scanDepth?: number;
  caseSensitive?: boolean;
  matchWholeWords?: boolean;
  excludeRecursion?: boolean;
  preventRecursion?: boolean;
  useGroupScoring?: boolean;
  matchPersonaDescription?: boolean;
  matchCharacterDescription?: boolean;
  matchCharacterPersonality?: boolean;
  matchCharacterDepthPrompt?: boolean;
  matchScenario?: boolean;
  matchCreatorNotes?: boolean;
  group?: string;
  decorators?: string[];
  characterFilter?: {
    isExclude?: boolean;
    names?: string[];
    tags?: number[];
  };
}

export interface Lorebook {
  id: string;
  name: string;
  description?: string;
  entries: LorebookEntry[];
  recursiveScanning: boolean;
  caseSensitive: boolean;
  matchWholeWords: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SillyTavernLorebookExport {
  name: string;
  description?: string;
  entries: Record<string, {
    uid: number;
    key: string[];
    keysecondary: string[];
    comment: string;
    content: string;
    constant: boolean;
    selective: boolean;
    selectiveLogic: 0 | 1 | 2 | 3;
    addMemo: boolean;
    order: number;
    position: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    role: number;
    disable: boolean;
    probability: number;
    depth: number;
    group: string;
    useProbability: boolean;
    excluded: boolean;
    sticky: number;
    cooldown: number;
    delay: number;
    weight: number;
    scanDepth: number;
    caseSensitive: boolean;
    matchWholeWords: boolean;
    excludeRecursion: boolean;
    preventRecursion: boolean;
    useGroupScoring: boolean;
    matchPersonaDescription: boolean;
    matchCharacterDescription: boolean;
    matchCharacterPersonality: boolean;
    matchCharacterDepthPrompt: boolean;
    matchScenario: boolean;
    matchCreatorNotes: boolean;
    decorators: string[];
    characterFilter: {
      isExclude?: boolean;
      names?: string[];
      tags?: number[];
    };
  }>;
  settings?: {
    recursive_scanning?: boolean;
    case_sensitive?: boolean;
    match_whole_words?: boolean;
  };
}

export interface MatchedEntry {
  entry: LorebookEntry;
  score: number;
  matchedKeywords: string[];
}

// ========== Preset Types ==========

/** SillyTavern-compatible chat completion preset.
 *  `settings` stores the raw SillyTavern preset JSON (temp_openai, prompt_order, prompts, etc.)
 */
export interface ChatPreset {
  id: string;
  name: string;
  description?: string;
  /** Raw SillyTavern preset fields. For OpenAI presets this includes temp_openai, prompt_order, prompts, etc. */
  settings: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

// ========== Settings Types ==========

export interface ApiSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeout: number;
  secondary?: {
    enabled: boolean;
    baseUrl: string;
    apiKey: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface AppSettings {
  key?: string;
  api: ApiSettings;
  /** 'single' = primary API handles all tasks. 'dual' = primary handles story, secondary handles variables. */
  apiMode: 'single' | 'dual';
  activePresetId: string | null;
  activeLorebookIds: string[];
  userName: string;
  characterName: string;
  theme: 'dark' | 'light';
  language: 'zh' | 'en';
  autoSave: boolean;
  autoSaveInterval: number;
  uiMode: 'game' | 'chat';
  customTags: string[];
  formatPromptTemplate: string;
  thinkingDisplay: 'fold' | 'hide' | 'inline';
}

export const DEFAULT_FORMAT_PROMPT = `你是微信聊天模拟器中的一个角色。你必须严格按照以下 XML 标签格式输出微信聊天消息，不要使用 Markdown。

<thinking>思考过程（可选，会被折叠隐藏）</thinking>
<chat type="text">文字聊天内容</chat>
<chat type="voice" duration="8">语音消息的文本描述</chat>
<chat type="video" duration="45">视频通话描述</chat>
<chat type="image">图片描述</chat>
<sum>本回合对话的一句总结</sum>
<vars>{ "好感度": 5 }</vars>

【重要规则】
1. 这是微信聊天模拟。你的回复就是角色在微信上发出的聊天消息，不是叙述性描写！
2. 使用 <chat> 标签包裹每条聊天消息。可以有多条 <chat>，代表连续发送。
3. type 属性：text=文字, voice=语音, video=视频通话, image=图片
4. 聊天内容应该口语化、自然、符合微信风格。可以分段、用表情符号。
5. 可以模拟各种聊天场景：问候、闲聊、约见面、语音留言、视频通话等。
6. 禁止使用 <option> 标签——用户直接在输入框自由回复。

【示例回复（角色：苏晓月）】
<thinking>用户主动打招呼，我应该友好回应，并结合北境遗迹的线索自然地引导对话。</thinking>
<chat type="text">在！刚还在看北境遗迹的资料</chat>
<chat type="text">你上次不是说想一起去吗？我查到了一个新线索</chat>
<chat type="voice" duration="5">（兴奋的语气）那个古代符文的位置，我基本确定了！明天有空吗？</chat>
<chat type="text">不过去之前你得准备几样东西：手电筒、登山鞋、还有……勇气 😄</chat>
<sum>苏晓月分享了北境遗迹的新线索，邀请用户明天一起探险</sum>
<vars>{ "好感度": 8, "冒险进度": 1 }</vars>`;

export const DEFAULT_TAGS = ['chat', 'sum', 'vars', 'thinking', 'think'] as const;
export const DEFAULT_OPAQUE_TAGS = ['thinking', 'think'] as const;

export const DEFAULT_SETTINGS: AppSettings = {
  api: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    timeout: 60000,
  },
  apiMode: 'single',
  activePresetId: null,
  activeLorebookIds: [],
  userName: '用户',
  characterName: 'AI',
  theme: 'dark',
  language: 'zh',
  autoSave: true,
  autoSaveInterval: 30,
  uiMode: 'chat',
  customTags: ['chat', 'sum', 'vars', 'thinking', 'think'],
  formatPromptTemplate: DEFAULT_FORMAT_PROMPT,
  thinkingDisplay: 'fold',
};

// ========== Chat Types ==========

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  variables?: Record<string, string | number>;
  metadata?: {
    tokenCount?: number;
    lorebookEntries?: string[];
    processingTime?: number;
  };
  parsed?: ParsedTags;
  variablesAfter?: Record<string, any>;
  apiUsed?: ApiTarget;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  characterName: string;
  userName: string;
  presetId: string | null;
  lorebookIds: string[];
  variables: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

// ========== Constants ==========

/** Common SillyTavern prompt_order identifiers used in OpenAI presets. */
export const DEFAULT_PROMPT_ORDER = [
  { identifier: 'main', name: 'Main Prompt', role: 'system' as const },
  { identifier: 'worldInfoBefore', name: 'World Info (Before)', role: 'system' as const },
  { identifier: 'charDescription', name: 'Character Description', role: 'system' as const },
  { identifier: 'charPersonality', name: 'Character Personality', role: 'system' as const },
  { identifier: 'scenario', name: 'Scenario', role: 'system' as const },
  { identifier: 'personaDescription', name: 'Persona Description', role: 'system' as const },
  { identifier: 'dialogueExamples', name: 'Dialogue Examples', role: 'system' as const },
  { identifier: 'chatHistory', name: 'Chat History', role: 'system' as const },
  { identifier: 'worldInfoAfter', name: 'World Info (After)', role: 'system' as const },
  { identifier: 'groupNudge', name: 'Group Nudge', role: 'system' as const },
];

export function createDefaultPreset(): Omit<ChatPreset, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: '默认预设',
    description: 'SillyTavern 兼容的默认 OpenAI 预设',
    settings: {
      temp_openai: 0.8,
      freq_pen_openai: 0,
      pres_pen_openai: 0,
      top_p_openai: 0.9,
      top_k_openai: 0,
      top_a_openai: 0,
      min_p_openai: 0,
      repetition_penalty_openai: 1,
      openai_max_context: 4096,
      openai_max_tokens: 2048,
      stream_openai: false,
      max_context_unlocked: false,
      chat_completion_source: 'openai',
      openai_model: 'gpt-3.5-turbo',
      main: 'Write {{char}}\'s next reply in a fictional chat between {{char}} and {{user}}.',
      nsfw: '',
      jailbreak: '',
      enhanceDefinitions: '',
      impersonation_prompt: '',
      new_chat_prompt: '',
      new_group_chat_prompt: '',
      new_example_chat_prompt: '',
      continue_nudge_prompt: '',
      wi_format: '',
      group_nudge_prompt: '',
      scenario_format: '',
      personality_format: '',
      prompts: [],
      prompt_order: DEFAULT_PROMPT_ORDER.map((p, i) => ({ ...p, enabled: true })),
    },
  };
}

// ========== v3 Game Mode Types ==========

export interface ChatEntry {
  type: 'text' | 'voice' | 'video' | 'image';
  content: string;
  duration?: number;
}

export interface ParsedTags {
  thinking: string;
  maintext: string;       // deprecated — use chats
  options: string[];       // deprecated — removed
  chats: ChatEntry[];      // chat-style messages
  sum: string;
  varsRaw: string;
  varsCommands: VarsPatch;
  unknown: Record<string, string>;
}

export interface VarsPatch {
  /** Object that will be deep-merged into chat.variables */
  merge: Record<string, any>;
}

export type Task = 'story' | 'summary' | 'vars';
export type ApiTarget = 'primary' | 'secondary';
