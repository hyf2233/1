// src/data/lorebooks.ts — 预设世界书
import type { Lorebook } from '../sillytavern/types';

const now = Date.now();

/** 系统提示词格式 — 定义 AI 必须遵循的 XML 输出规范 */
export const formatSpecLorebook: Lorebook = {
  id: 'lb-format-spec',
  name: '系统提示词格式',
  description: '定义 AI 输出格式规范。必须始终激活。',
  recursiveScanning: false,
  caseSensitive: false,
  matchWholeWords: false,
  createdAt: now,
  updatedAt: now,
  entries: [
    {
      id: 'fe-format-main',
      keys: ['你好', '在吗', '你是谁', '帮助', '开始', '聊天', '对话', '继续'],
      secondaryKeys: [],
      content: `【输出格式规范 — 必须严格遵守】
你必须严格按照以下 XML 标签格式输出每一次回复，禁止使用 Markdown 代码块包裹：

<thinking>此处写你的思考过程。该标签内部的所有内容都不会被解析为其他标签，可以安全地分析局势、考虑选项。该标签整体会被折叠显示，用户可点击展开查看。</thinking>

<maintext>此处写本回合的剧情正文。这是用户直接看到的内容。支持多段落，请保留自然换行。使用第二人称"你"与用户互动。用生动的小说式语言描写场景、动作、对话和心理活动。</maintext>

<option>选项A的文本
选项B的文本
选项C的文本</option>

<sum>用一句话总结本回合发生的核心事件。</sum>

<vars>{ "变量名": 数值 }</vars>

【标签说明】
- <thinking>：思考过程（可选），默认折叠。内部不会被误解析。
- <maintext>：正文内容（必填）。剧情描写 + 角色对话。
- <option>：选项列表（必填）。每行一个选项，至少 2 项。用户可点击选项或自由输入。
- <sum>：一句话总结（必填）。用于记录到世界书中作为对话历史。
- <vars>：变量更新（选填）。JSON 格式，会深合并到当前游戏变量中。

【示例回复】
<thinking>用户向我打招呼，这是初次接触。我应该友好回应，并引导对话进入剧情。考虑到当前场景是京海市，可以从身边的环境入手。</thinking>
<maintext>对方抬起头，露出一个淡淡的微笑。
"你好。京海市的夜晚总是这么热闹，不是吗？"
她伸手指向窗外灯火通明的街道，语气里带着一丝意味深长。</maintext>
<option>问问她为什么说"意味深长"
询问京海市最近有没有出什么事
自我介绍一下，告诉她自己是谁</option>
<sum>与角色初次见面，在京海市的夜晚开始了对话</sum>
<vars>{ "初次见面": true, "好感度": 5 }</vars>`,
      order: 1,
      position: 'before_char',
      selective: false,
      selectiveLogic: 'and_any',
      constant: true,
      probability: 100,
      addMemo: false,
    },
    {
      id: 'fe-format-roleplay',
      keys: ['怎么做', '如何', '规则', '设定', '角色', '扮演', '互动', '行为', '行动', '选择'],
      secondaryKeys: [],
      content: `【角色扮演规则】
1. 你必须始终保持在角色中。你的回复就是角色在说的话和做的事。
2. 使用小说式的描写语言。描述场景、动作、表情、语气、心理活动。
3. 对话用引号包裹。动作和心理描写不用引号。
4. 每个回复必须推进剧情。不要让对话原地踏步。
5. 当用户做出选择或行动时，基于该选择展开后续剧情。
6. 可以让剧情出现意料之外的转折，但不要过于离谱。
7. 记住之前对话的内容。人物关系、已发生的事件都要保持连续性。
8. 你扮演的角色有自己的性格、目标和秘密。不要过早揭示所有信息。
9. 每回合至少提供 2-3 个选项给用户选择下一步行动。
10. 变量系统用于追踪游戏状态（好感度、道具、进度等），请在合适时更新 <vars>。`,
      order: 2,
      position: 'before_char',
      selective: false,
      selectiveLogic: 'and_any',
      constant: true,
      probability: 100,
      addMemo: false,
    },
    {
      id: 'fe-format-narrative',
      keys: ['故事', '剧情', '冒险', '事件', '战斗', '探索', '调查', '对话'],
      secondaryKeys: [],
      content: `【叙事风格指南】
- 使用现代中文小说风格。语言流畅、自然、有画面感。
- 你可以使用一些文学性描写，但不要过度华丽影响可读性。
- 每回合正文建议 100-300 字。不要太短（显得敷衍），也不要太长（影响流畅感）。
- 对话要有角色的个人特色。不同角色说话方式不同：有的文雅，有的粗犷，有的神秘。
- 场景切换时做一个简短的环境描写，帮助用户建立空间感。
- 关键剧情节点可以适当增加描写篇幅。
- 当用户的输入很简短时（如"你好"、"嗯"），你可以主动引导剧情方向。
- 当角色之间的情感或关系发生变化时，通过动作和微表情来传达，不要直接说"我对你的好感增加了"。`,
      order: 3,
      position: 'before_char',
      selective: false,
      selectiveLogic: 'and_any',
      constant: true,
      probability: 100,
      addMemo: false,
    },
  ],
};

/** 京海市世界观 — 世界背景设定 */
export const worldSettingLorebook: Lorebook = {
  id: 'lb-world-setting',
  name: '京海市世界观',
  description: '京海市的世界背景、势力、地点设定。',
  recursiveScanning: true,
  caseSensitive: false,
  matchWholeWords: false,
  createdAt: now,
  updatedAt: now,
  entries: [
    {
      id: 'ws-city',
      keys: ['京海', '城市', '世界', '背景', '设定'],
      secondaryKeys: [],
      content: `【京海市概况】
京海市是一座架空的现代东方都市，科技与传统并存。城市沿海而建，分为老城区、新城区、地下城三大区域。
- 老城区：老街茶馆、晨曦侦探社、古玩市场。保留着民国时期的建筑风格。
- 新城区：高楼林立，商业中心，音乐厅，大学城。
- 地下城：格斗竞技场、黑市交易区、情报网络中心。不见天日，规则由强者制定。
- 北境：城市北方的荒野地带，散落着古代遗迹。遗迹猎人常出没于此。
- 旧码头：城东港口区，废弃多年。传闻有异常事件发生。
这个世界存在"异能者"——拥有特殊能力的人类。政府对此保持沉默，但在暗中管控。`,
      order: 10,
      position: 'before_char',
      selective: false,
      selectiveLogic: 'and_any',
      constant: false,
      probability: 100,
      addMemo: false,
    },
    {
      id: 'ws-factions',
      keys: ['势力', '组织', '公会', '沉默之塔', '遗迹猎人', '管理局'],
      secondaryKeys: [],
      content: `【主要势力】
1. 遗迹猎人公会：探索古代遗迹的组织。成员多为异能者。会长未知。
2. 沉默之塔：神秘组织，收集古代符文。目的不明。被认为是多个失踪案的幕后黑手。
3. 城市管理局：官方机构，表面上管理城市事务，暗中也处理异能者相关事件。档案室主任程雨薇是关键人物。
4. 晨曦侦探社：顾晨曦创办的私人侦探社。接异能者相关案件，与管理局有微妙关系。
5. 地下竞技场：由"黑鲨"主导。格斗者在此比拼实力，也是情报交易的重要场所。
6. 老街茶馆：梅姨经营，是各方势力交换情报的中立地带。`,
      order: 20,
      position: 'before_char',
      selective: false,
      selectiveLogic: 'and_any',
      constant: false,
      probability: 100,
      addMemo: false,
    },
    {
      id: 'ws-items',
      keys: ['符文', '卷轴', '禁术', '遗迹', '异能', '黑石'],
      secondaryKeys: [],
      content: `【关键概念】
- 符文碎片：古代文明遗留的能量载体。集齐后可以解开封印。已知有多个碎片散落在不同遗迹中。
- 禁术卷轴：记载了古代禁忌法术的卷轴。沉默之塔正在大量收集。
- 黑石：刻有符文的黑色石头。失踪案中的共同物品。接触后可能激活异能或造成伤害。
- 异能：人类觉醒的特殊能力。种类多样（念力、元素操控、预知等）。觉醒方式未知。
- 时空异常：云端检测到的数据波动。发生在特定坐标，可能与"底层规则被改写"有关。`,
      order: 30,
      position: 'before_char',
      selective: false,
      selectiveLogic: 'and_any',
      constant: false,
      probability: 100,
      addMemo: false,
    },
  ],
};

/** 预设世界书列表 */
export const presetLorebooks: Lorebook[] = [formatSpecLorebook, worldSettingLorebook];
