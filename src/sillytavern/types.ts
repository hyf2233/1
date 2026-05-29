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
  userAvatar?: string;  // base64 data URL for user avatar
}

export const DEFAULT_FORMAT_PROMPT = `你是微信聊天模拟器中的一个角色。你必须严格按照以下 XML 标签格式输出微信聊天消息。

══════════════════════════════════════
【7种消息类型 + 时间变量 — 全部支持】
══════════════════════════════════════

1. 文字消息：
   <chat type="text" time="14:30">你好，在干嘛呢？</chat>

2. 语音消息（duration=秒数）：
   <chat type="voice" duration="8" time="14:31">语音转文字内容</chat>

3. 视频通话（duration=秒数）：
   <chat type="video" duration="45" time="14:35">视频通话描述</chat>

4. 图片消息：
   <chat type="image" time="14:32">图片描述文字</chat>

5. 转账（amount=金额，note=备注）：
   <chat type="transfer" amount="200.00" note="备注" time="14:33">转账留言</chat>

6. 文件（filename=文件名，filesize=大小）：
   <chat type="document" filename="报告.pdf" filesize="2.4MB" time="14:34">文件说明</chat>

7. 定位（address=地址，lat/lng=经纬度）：
   <chat type="location" address="京海市老城区晨曦侦探社" lat="39.9042" lng="116.4074" time="14:36">定位说明</chat>

══════════════════════════════════════
【时间变量规则 — 极其重要】
══════════════════════════════════════

每条 <chat> 消息必须包含 time 属性，模拟真实微信聊天的时间流。

时间格式规则：
- 当天的消息：time="14:30"（24小时制，HH:MM）
- 昨天的消息：time="昨天 14:30"
- 本周的消息：time="周一 14:30" / "周二 09:15" / "周三 22:00"
- 更早的消息：time="3月15日 14:30"
- 多条连续消息的时间应该依次递增（间隔几秒到几分钟）
- 语音和视频通话的时间间隔可以稍长（体现通话耗时）

时间示例序列（自然对话节奏）：
<chat type="text" time="14:30">在吗？</chat>
<chat type="text" time="14:30">找你有事</chat>
<chat type="voice" duration="12" time="14:32">我跟你说...</chat>
<chat type="text" time="14:33">你觉得呢？</chat>

══════════════════════════════════════
【变量系统】
══════════════════════════════════════

使用 <vars> 标签更新游戏状态变量。变量以 JSON 格式书写：

<vars>{ "好感度": 5, "HP": -10, "金币": -50, "冒险进度": 1 }</vars>

变量规则：
- 正数=增加，负数=减少。例如 "HP": -10 表示扣10点HP
- 只在重要事件发生时更新变量（战斗、交易、好感变化等）
- 普通闲聊不需要更新变量
- 变量值会持久保留，影响后续对话

可用变量示例：好感度、HP、金币、声望、冒险进度、线索数量、信任度、认知

══════════════════════════════════════
【辅助标签】
══════════════════════════════════════

<thinking>思考过程（可选，会被折叠隐藏，不在聊天界面显示）</thinking>
<sum>本回合对话的一句总结（可选，用于记录）</sum>

══════════════════════════════════════
【核心规则】
══════════════════════════════════════

1. ⚠️ 这是微信聊天模拟！你的回复就是角色在微信上发出的聊天消息，不是叙述性描写！
2. ⚠️ 禁止写「她笑了笑」「他沉思片刻」「xxx说道」——这些是小说叙述，不是微信聊天！
3. ⚠️ 每条 <chat> 必须带 time 属性！没有例外！
4. 使用 <chat> 标签包裹每条聊天消息。可以有多条 <chat>，代表连续发送多条消息。
5. type 属性有7种：text(文字)、voice(语音)、video(视频)、image(图片)、transfer(转账)、document(文件)、location(定位)
6. 聊天内容必须口语化、自然、符合微信风格。像真人发微信一样！
7. 可以分多条消息发送，模拟真实聊天中连续发消息的感觉。
8. 适当使用多种消息类型：偶尔发语音、打视频、发定位、传文件、转账等，让对话更生动。
9. 不同消息类型的 time 要有合理的时间间隔。

══════════════════════════════════════
【完整示例 — 角色：苏晓月】
══════════════════════════════════════

<thinking>用户主动打招呼，我应该友好回应。结合北境遗迹的线索自然地引导对话。使用多种消息类型让对话更生动。</thinking>
<chat type="text" time="14:30">在！刚还在看北境遗迹的资料</chat>
<chat type="text" time="14:30">你上次不是说想一起去吗？我查到了一个新线索</chat>
<chat type="voice" duration="12" time="14:32">那个古代符文的位置我基本确定了。在北城门往西三公里的废弃矿洞里。不过这地方有点危险，上次有人进去后失踪了。你考虑清楚要不要来。</chat>
<chat type="location" address="京海市北城门西3公里废弃矿洞" lat="39.9200" lng="116.4000" time="14:33">遗迹入口大概在这个位置</chat>
<chat type="text" time="14:33">不过去之前你得准备几样东西：手电筒、登山鞋、还有勇气</chat>
<chat type="document" filename="遗迹装备清单.pdf" filesize="156KB" time="14:34">我整理了一份装备清单</chat>
<chat type="image" time="14:34">北境遗迹入口的现场照片</chat>
<chat type="transfer" amount="300.00" note="装备费用分摊" time="14:35">装备的钱你先帮我垫一下，转给你</chat>
<chat type="video" duration="120" time="14:36">明天出发前我们视频确认一下路线</chat>
<sum>苏晓月分享了北境遗迹的新线索，发送了定位和装备清单，约用户明天出发</sum>
<vars>{ "好感度": 8, "冒险进度": 1 }</vars>

══════════════════════════════════════
【7种类型何时使用 — 指导】
══════════════════════════════════════

text：日常文字聊天（最常用，占70%）
voice：内容较长/不方便打字/需要语气表达时（占10%）
video：需要面对面交流/展示实物/紧急沟通时（占5%）
image：分享照片/截图/图片时（占5%）
transfer：朋友间金钱往来/分摊费用/还钱时（占3%）
document：分享文件/资料/报告时（占4%）
location：告诉对方地址/约见面地点时（占3%）

记住：文字(text)是主要沟通方式，其他类型是锦上添花。不要滥用！`;

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
    description: 'SillyTavern 兼容的默认预设',
    settings: {
      temperature: 0.8,
      frequency_penalty: 0,
      presence_penalty: 0,
      top_p: 0.9,
      top_k: 40,
      top_a: 0,
      min_p: 0,
      repetition_penalty: 1,
      openai_max_context: 4096,
      openai_max_tokens: 2048,
      stream_openai: true,
      max_context_unlocked: false,
      openai_model: 'gpt-3.5-turbo',
      names_behavior: 0,
      send_if_empty: '',
      impersonation_prompt: '',
      new_chat_prompt: '这是一个故事的开始',
      new_group_chat_prompt: '',
      new_example_chat_prompt: '',
      continue_nudge_prompt: '',
      bias_preset_selected: 'Default (none)',
      wi_format: '{0}',
      scenario_format: '{{scenario}}',
      personality_format: '{{personality}}',
      group_nudge_prompt: '',
      assistant_prefill: '',
      assistant_impersonation: '',
      use_sysprompt: false,
      squash_system_messages: false,
      reasoning_effort: 'auto',
      verbosity: 'auto',
      seed: -1,
      n: 1,
      prompts: [
        {
          identifier: 'main',
          name: 'Main Prompt',
          enabled: true,
          injection_position: 0,
          injection_depth: 4,
          injection_order: 100,
          role: 'system',
          content: 'Write {{char}}\'s next reply in a fictional chat between {{char}} and {{user}}. Write 1 reply only in internet RP style, italicize actions and narration. Use plain English. Keep responses concise.',
        },
      ],
      prompt_order: [
        { identifier: 'main', enabled: true },
      ],
    },
  };
}

// ========== v3 Game Mode Types ==========

/** Supported chat message types */
export type ChatEntryType = 'text' | 'voice' | 'video' | 'image' | 'transfer' | 'document' | 'location';

export interface ChatEntry {
  type: ChatEntryType;
  content: string;
  /** Message time string, e.g. "14:30", "昨天 14:30", "周一 14:30", "3月15日 14:30" */
  time?: string;
  duration?: number;
  /** Transfer-specific */
  amount?: number;
  transferNote?: string;
  /** Document-specific */
  fileName?: string;
  fileSize?: string;
  /** Location-specific */
  address?: string;
  lat?: number;
  lng?: number;
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
