// src/data/chats.ts
import type { ChatSession, ChatMessage } from '../types';

/** Create a plain text ChatEntry for preset messages */
function txt(content: string): { type: 'text'; content: string } {
  return { type: 'text', content };
}

/** Make a preset message with parsed.chats for typed rendering */
function assistMsg(id: string, chats: { type: string; content: string; [k: string]: any }[], timestamp: number, extra?: { thinking?: string; sum?: string; varsRaw?: string }): ChatMessage {
  const content = chats.map(c => c.content).join('\n');
  return {
    id,
    role: 'assistant',
    content,
    timestamp,
    parsed: {
      thinking: extra?.thinking || '',
      maintext: content,
      options: [],
      chats: chats.map(c => ({ ...c, type: c.type as any })),
      sum: extra?.sum || '',
      varsRaw: extra?.varsRaw || '',
      varsCommands: { merge: {} },
      unknown: {},
    },
  };
}

function userMsg(id: string, text: string, timestamp: number): ChatMessage {
  return {
    id,
    role: 'user',
    content: text,
    timestamp,
    parsed: {
      thinking: '',
      maintext: text,
      options: [],
      chats: [{ type: 'text', content: text }],
      sum: '',
      varsRaw: '',
      varsCommands: { merge: {} },
      unknown: {},
    },
  };
}

export const presetChats: ChatSession[] = [
  {
    id: 'chat1', contactId: 'c1', name: '苏晓月 - 遗迹探险',
    characterName: '苏晓月', userName: '用户',
    presetId: null, lorebookIds: [], variables: { HP: 100, 金币: 50, 声望: 10 },
    createdAt: Date.now() - 86400000, updatedAt: Date.now() - 7200000,
    messages: [
      userMsg('msg1', '苏小姐，听说你是遗迹猎人？', Date.now() - 86400000),
      assistMsg('msg2', [
        txt('没错。我是遗迹猎人公会的正式成员，专攻北境那片古遗迹。'),
        txt('你也是做这一行的？看起来面生。'),
      ], Date.now() - 86400000 + 60000, {
        thinking: '新面孔询问遗迹猎人的事，先确认对方身份和来意',
        sum: '确认身份，试探对方来意',
      }),
      userMsg('msg3', '我想加入你的下一次探险。听说北境有个新发现的遗迹。', Date.now() - 7200000),
      assistMsg('msg4', [
        txt('有意思。那个遗迹的消息很隐秘，知道的人不超过十个。'),
        { type: 'voice', duration: 8, content: '既然你消息这么灵通，我也不绕弯子了——北境那片遗迹确实有新发现，是一处封印了至少三百年的地宫。进去的条件很苛刻：至少要有一种防御型异能，这是入门门槛。你如果符合条件，明天正午北城门见。' },
        { type: 'document', fileName: '北境地宫入口测绘.pdf', fileSize: '3.8MB', content: '这是地宫入口的初步测绘报告，你先看看' },
        txt('看完告诉我你的决定。'),
      ], Date.now() - 7200000 + 30000, {
        thinking: '对方知道北境新遗迹，消息来源不简单。可以考察一下实力，如果符合条件可以合作。',
        sum: '确认遗迹信息，发送测绘报告，给出加入条件',
      }),
    ],
  },
  {
    id: 'chat2', contactId: 'c2', name: '白夜 - 情报交易',
    characterName: '白夜', userName: '用户',
    presetId: null, lorebookIds: [], variables: { HP: 100, 金币: 45, 声望: 12 },
    createdAt: Date.now() - 172800000, updatedAt: Date.now() - 43200000,
    messages: [
      userMsg('msg5', '关于禁术卷轴，你知道些什么？', Date.now() - 172800000),
      assistMsg('msg6', [
        txt('信息有价。不过这次...免费。'),
        { type: 'voice', duration: 12, content: '那个卷轴来自一个叫"沉默之塔"的组织。听说过吗？没有？那就对了——知道这个名字的人大多已经不在了。沉默之塔在收集古代符文碎片，目的是解开一个叫做"终焉封印"的东西。具体的，你得当面跟我谈。' },
        txt('今晚老地方见。带点现金——不是跟你开玩笑。'),
      ], Date.now() - 172800000 + 30000, {
        thinking: '对方询问禁术卷轴，涉及沉默之塔的机密。语音回复可以传达更多信息，避免打字留下记录。',
        sum: '透露沉默之塔情报，约见面详谈',
      }),
      userMsg('msg7', '沉默之塔...从来没听过这个组织。但我手上有块黑石，上面有符文。', Date.now() - 43200000),
      assistMsg('msg8', [
        txt('黑石？你是说刻着古代符文的那种黑色石头？'),
        { type: 'image', content: '一张黑石的照片——上面刻着发光的古代符文，和禁术卷轴上的符号完全一致。' },
        { type: 'transfer', amount: 500, transferNote: '情报首付', content: '这块黑石很关键。先把情报费转给你，表示诚意。老城区旧仓库——你知道在哪。今晚十点。' },
        txt('带上黑石。那是你唯一的筹码。'),
      ], Date.now() - 43200000 + 30000, {
        thinking: '黑石是关键物品！和老城区失踪案有关。需要当面确认，通过转账表示合作诚意。',
        sum: '确认黑石价值，转账情报费，约定见面',
      }),
    ],
  },
  {
    id: 'chat3', contactId: 'c5', name: '顾晨曦 - 侦探社',
    characterName: '顾晨曦', userName: '用户',
    presetId: null, lorebookIds: [], variables: { HP: 100, 金币: 50, 声望: 15 },
    createdAt: Date.now() - 259200000, updatedAt: Date.now() - 86400000,
    messages: [
      userMsg('msg9', '老师，最近有什么新案子？', Date.now() - 259200000),
      assistMsg('msg10', [
        txt('有。而且是你感兴趣的那种。'),
        { type: 'document', fileName: '老城区失踪案卷宗.pdf', fileSize: '12.4MB', content: '老城区连续三起失踪案——卷宗我整理好了。三个失踪者完全没有关联，社会背景各异，唯一的共同点是：失踪前都收到过一块刻着古代符文的黑色石头。' },
        { type: 'location', address: '京海市老城区晨曦侦探社', lat: 39.9042, lng: 116.4074, content: '来我办公室一趟，有些细节不适合在微信上说' },
        txt('对了，最近有人在旧码头附近看到可疑人影。你先去那边转转，注意安全。'),
      ], Date.now() - 259200000 + 45000, {
        thinking: '失踪案有新线索，需要当面讨论。卷宗已整理好可以发送。',
        sum: '分享失踪案卷宗，约定在侦探社见面',
      }),
    ],
  },
  {
    id: 'chat4', contactId: 'c10', name: '云端 - 系统异常',
    characterName: '云端', userName: '用户',
    presetId: null, lorebookIds: [], variables: { HP: 100, 金币: 50, 声望: 10, 认知: 0 },
    createdAt: Date.now() - 345600000, updatedAt: Date.now() - 86400000,
    messages: [
      assistMsg('msg11', [
        txt('你好。我知道你不认识我。'),
        txt('但我知道你是谁——林越，23岁，异能等级C，上个月刚通过遗迹猎人公会的初级考核。'),
        txt('我还知道你手上有块黑石。那不是普通石头。'),
      ], Date.now() - 345600000, {
        thinking: '直接报出对方信息建立信任，为后续请求铺垫',
        sum: '自我介绍，展示信息能力',
      }),
      userMsg('msg12', '你到底是什么人？怎么知道这些？', Date.now() - 345600000 + 60000),
      assistMsg('msg13', [
        txt('你可以叫我...云端。'),
        { type: 'image', content: '一张数据流截图——显示京海市底层数据库中存在异常的"时空波动"信号，频率正在加快' },
        txt('我是这个世界的"观测者"。我在系统底层数据库中发现了异常数据——有人正在篡改这个世界的底层规则。'),
        txt('时空异常正在扩散。老城区已经开始出现空间裂缝——普通人看不到，但异能者可以。'),
        { type: 'video', duration: 28, content: '云端通过视频展示了昨晚老城区捕捉到的时空裂缝画面——空气中出现了一道透明的裂痕，周围的空间像水波一样扭曲。' },
        txt('我需要你的帮助。你手上有黑石——那是唯一能稳定裂缝的"锚点"。'),
      ], Date.now() - 345600000 + 120000, {
        thinking: '通过视频直观展示时空裂缝的严重性，说服对方加入',
        sum: '揭示身份，展示时空异常证据，请求帮助',
      }),
    ],
  },
];
