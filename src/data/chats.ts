// src/data/chats.ts
import type { ChatSession } from '../types';

export const presetChats: ChatSession[] = [
  {
    id: 'chat1', contactId: 'c1', name: '苏晓月 - 遗迹探险',
    characterName: '苏晓月', userName: '用户',
    presetId: null, lorebookIds: [], variables: { HP: 100, 金币: 50, 声望: 10 },
    createdAt: Date.now() - 86400000, updatedAt: Date.now() - 7200000,
    messages: [
      { id: 'msg1', role: 'user', content: '苏小姐，听说你是遗迹猎人？', timestamp: Date.now() - 86400000 },
      { id: 'msg2', role: 'assistant', content: '没错。北境遗迹的事，你也感兴趣？', timestamp: Date.now() - 86400000 + 60000 },
      { id: 'msg3', role: 'user', content: '我想加入你的下一次探险', timestamp: Date.now() - 7200000 },
      {
        id: 'msg4', role: 'assistant',
        content: '好。看来你是认真的。那我直说了——遗迹里不太平，上次遇到了自动防卫机关。如果你决定加入，明天正午，北城门见。',
        timestamp: Date.now() - 7200000 + 30000,
      },
    ],
  },
  {
    id: 'chat2', contactId: 'c2', name: '白夜 - 情报交易',
    characterName: '白夜', userName: '用户',
    presetId: null, lorebookIds: [], variables: { HP: 100, 金币: 45, 声望: 12 },
    createdAt: Date.now() - 172800000, updatedAt: Date.now() - 43200000,
    messages: [
      { id: 'msg5', role: 'user', content: '关于禁术卷轴，你知道些什么？', timestamp: Date.now() - 172800000 },
      { id: 'msg6', role: 'assistant', content: '信息有价。不过这次...免费。那个卷轴来自"沉默之塔"。听说过吗？', timestamp: Date.now() - 172800000 + 30000 },
      { id: 'msg7', role: 'user', content: '沉默之塔...没有印象', timestamp: Date.now() - 43200000 },
      {
        id: 'msg8', role: 'assistant',
        content: '那就对了。知道它的人大多已经不在了。今晚老地方见，我给你一些参考资料。带点现金。',
        timestamp: Date.now() - 43200000 + 30000,
      },
    ],
  },
  {
    id: 'chat3', contactId: 'c5', name: '顾晨曦 - 侦探社',
    characterName: '顾晨曦', userName: '用户',
    presetId: null, lorebookIds: [], variables: { HP: 100, 金币: 50, 声望: 15 },
    createdAt: Date.now() - 259200000, updatedAt: Date.now() - 86400000,
    messages: [
      { id: 'msg9', role: 'user', content: '老师，最近有什么新案子？', timestamp: Date.now() - 259200000 },
      { id: 'msg10', role: 'assistant', content: '有。而且是你感兴趣的案子。老城区连续三起失踪案，卷宗我刚拿到。来我办公室一趟。', timestamp: Date.now() - 259200000 + 45000 },
    ],
  },
  {
    id: 'chat4', contactId: 'c10', name: '云端 - 系统异常',
    characterName: '云端', userName: '用户',
    presetId: null, lorebookIds: [], variables: { HP: 100, 金币: 50, 声望: 10, 认知: 0 },
    createdAt: Date.now() - 345600000, updatedAt: Date.now() - 86400000,
    messages: [
      { id: 'msg11', role: 'assistant', content: '你好。我知道你不认识我。但我知道你是谁。', timestamp: Date.now() - 345600000 },
      { id: 'msg12', role: 'user', content: '你是谁？', timestamp: Date.now() - 345600000 + 60000 },
      { id: 'msg13', role: 'assistant', content: '你可以叫我...云端。我在系统中发现了异常数据。有人正在篡改这个世界的底层规则。我需要你的帮助。', timestamp: Date.now() - 345600000 + 120000 },
    ],
  },
];
