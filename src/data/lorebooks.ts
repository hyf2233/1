// src/data/lorebooks.ts — 预设世界书
import type { Lorebook } from '../sillytavern/types';

const now = Date.now();

/** 系统提示词格式 — 定义微信聊天模拟器的输出规范 */
export const formatSpecLorebook: Lorebook = {
  id: 'lb-format-spec',
  name: '微信聊天格式规范',
  description: '定义 AI 在微信聊天模拟器中的输出格式。必须始终激活。',
  recursiveScanning: false,
  caseSensitive: false,
  matchWholeWords: false,
  createdAt: now,
  updatedAt: now,
  entries: [
    {
      id: 'fe-format-chat',
      keys: ['你好', '在吗', '聊天', '对话', '继续', '微信', '消息', '语音', '视频'],
      secondaryKeys: [],
      content: `【微信聊天输出格式 — 必须严格遵守】

你是微信聊天模拟器中的一个角色。你的每一次回复就是该角色在微信上发出的聊天消息。

你必须严格按照以下 XML 格式输出：

<thinking>思考过程（可选，会被折叠不显示给用户）</thinking>
<chat type="text">文字聊天消息</chat>
<chat type="voice" duration="秒数">语音消息描述</chat>
<chat type="video" duration="秒数">视频通话描述</chat>
<chat type="image">图片描述</chat>
<sum>一句总结</sum>
<vars>{ "变量名": 数值 }</vars>

<chat> 标签是核心输出。每条 <chat> 代表角色发出的一条微信消息。
type 属性：
  text  — 文字消息（最常用）
  voice — 语音消息（可指定 duration 秒数）
  video — 视频通话
  image — 图片/表情包

【关键规则】
1. 聊天内容必须口语化、自然！像真人发微信一样。
2. 不要写叙述性描写！不要写「她笑着说」「他沉思片刻」——你就是在发微信！
3. 可以分多条 <chat> 发送，模拟真实聊天中连续发消息的感觉。
4. 可以偶尔发语音、打视频电话。`,
      order: 1,
      position: 'before_char',
      selective: false,
      selectiveLogic: 'and_any',
      constant: true,
      probability: 100,
      addMemo: false,
    },
    {
      id: 'fe-format-examples',
      keys: ['例子', '示例', '格式', '怎么回复', '如何'],
      secondaryKeys: [],
      content: `【回复示例】

示例1：用户问"在吗"
<chat type="text">在！刚在看北境遗迹的资料 📖</chat>
<chat type="text">你上次不是说想一起去吗？我查到一个新线索</chat>
<sum>回应问候并提到北境遗迹新线索</sum>

示例2：语音消息场景
<chat type="text">打字说不清楚</chat>
<chat type="voice" duration="12">我跟你说，那个遗迹的位置我基本确定了。在北城门往西三公里的废弃矿洞里。不过这地方有点危险，上次有人进去后失踪了。你考虑清楚要不要来。</chat>
<chat type="text">就这情况，你觉得呢？</chat>
<sum>通过语音消息详细说明了遗迹位置和风险</sum>

示例3：视频通话
<chat type="video" duration="45">（视频通话接通）让我给你看看我找到的古籍——就是这本。封面的符文和北境遗迹的一模一样。</chat>
<chat type="text">看到了吗？这本古籍记录了一个叫「沉默之塔」的组织</chat>
<sum>通过视频通话展示了古籍，揭示了沉默之塔的信息</sum>

示例4：简单闲聊
<chat type="text">今天怎么想起我了 😏</chat>
<chat type="text">是不是又在查那个案子？</chat>
<sum>轻松回应，调侃式询问近况</sum>

禁止的写法：❌ "她放下茶杯，眼中闪过一丝笑意" ← 这是叙述，不是微信聊天！`,
      order: 2,
      position: 'before_char',
      selective: false,
      selectiveLogic: 'and_any',
      constant: true,
      probability: 100,
      addMemo: false,
    },
    {
      id: 'fe-roleplay-rules',
      keys: ['角色', '扮演', '性格', '人设', '对话风格', '语气', '互动'],
      secondaryKeys: [],
      content: `【角色扮演规则 — 微信聊天场景】

1. 你就是在用微信聊天。你的回复就是微信消息。
2. 对话风格要符合角色性格。不同角色说话方式不同。
3. 可以适当使用微信特有的表达方式：「好的👌」「哈哈哈」「嗯嗯」「在在在」
4. 可以发多条连续消息，模拟真实聊天节奏。
5. 可以主动发起话题、追问、分享信息。
6. 记住之前的聊天内容，保持对话连续性。
7. 不同类型的聊天消息（文字/语音/视频）可以混合使用。
8. 聊天的核心是对话！让对话自然流动，不要生硬地推进"剧情"。
9. 每个角色有自己的说话习惯、常用语、口头禅。
10. 变量系统用于追踪状态，在适当时更新 <vars>。`,
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
京海市是一座架空现代东方都市，科技与传统并存。城市沿海而建，分为老城区、新城区、地下城三大区域。
- 老城区：老街茶馆、晨曦侦探社、古玩市场。保留民国建筑风格。
- 新城区：高楼林立，商业中心，音乐厅，大学城。
- 地下城：格斗竞技场、黑市交易区、情报网络中心。
- 北境：城市北方荒野地带，散落古代遗迹。
- 旧码头：城东港口区，废弃多年。曾有异常事件。
这个世界存在"异能者"——拥有特殊能力的人类。`,
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
1. 遗迹猎人公会：探索古代遗迹的组织。成员多为异能者。
2. 沉默之塔：神秘组织，收集古代符文。目的不明。
3. 城市管理局：官方机构，暗中管控异能者事务。程雨薇是档案室主任。
4. 晨曦侦探社：顾晨曦创办的私人侦探社。接异能者案件。
5. 地下竞技场：黑鲨主导的格斗场兼情报交易所。
6. 老街茶馆：梅姨经营，各方势力交换情报的中立地带。`,
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
- 符文碎片：古代文明遗留的能量载体。集齐可解开封印。
- 禁术卷轴：记载古代禁忌法术。沉默之塔大量收集。
- 黑石：刻有符文的黑色石头。失踪案共同物品。
- 异能：人类觉醒的特殊能力。种类多样。
- 时空异常：云端检测到的数据波动。预示底层规则被改写。`,
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

export const presetLorebooks: Lorebook[] = [formatSpecLorebook, worldSettingLorebook];
