// src/data/contacts.ts
import type { Contact } from '../types';

export const presetContacts: Contact[] = [
  {
    id: 'c1', name: '苏晓月', avatar: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    avatarType: 'gradient', bio: '遗迹猎人公会成员，擅长古代文字解读',
    region: '京海市', phone: '138-0000-0001',
    lastMessage: '北边的遗迹最近很不安静...', lastMessageTime: '14:32',
    online: true, pinned: true, unreadCount: 2, muted: false, tags: ['冒险伙伴', 'NPC'],
  },
  {
    id: 'c2', name: '白夜', avatar: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    avatarType: 'gradient', bio: '神秘的情报贩子，知晓一切',
    region: '未知', phone: '138-0000-0002',
    lastMessage: '今晚在老地方见面', lastMessageTime: '12:15',
    online: true, pinned: true, unreadCount: 0, muted: false, tags: ['情报源', 'NPC'],
  },
  {
    id: 'c3', name: '林若雪', avatar: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    avatarType: 'gradient', bio: '北境剑术传人，性格清冷但重情义',
    region: '北境·剑阁', phone: '138-0000-0003',
    lastMessage: '谢谢你上次的帮助', lastMessageTime: '昨天',
    online: false, pinned: false, unreadCount: 0, muted: false, tags: ['冒险伙伴', 'NPC'],
  },
  {
    id: 'c4', name: '程雨薇', avatar: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    avatarType: 'gradient', bio: '城市管理局档案室主任。你的前女友。',
    region: '京海市', phone: '138-0000-0004',
    lastMessage: '这个案子你不要再查下去了', lastMessageTime: '周一',
    online: false, pinned: false, unreadCount: 5, muted: true, tags: ['关键人物', 'NPC'],
  },
  {
    id: 'c5', name: '顾晨曦', avatar: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    avatarType: 'gradient', bio: '晨曦侦探社创始人，你的好友兼导师',
    region: '京海市·老城区', phone: '138-0000-0005',
    lastMessage: '有个新的案子，你有兴趣吗？', lastMessageTime: '周日',
    online: true, pinned: false, unreadCount: 0, muted: false, tags: ['好友', 'NPC'],
  },
  {
    id: 'c6', name: '赵铁柱', avatar: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    avatarType: 'gradient', bio: '武器铺老板，江湖人称"铁手"',
    region: '京海市·商业街', phone: '138-0000-0006',
    lastMessage: '你订的那批货到了', lastMessageTime: '周六',
    online: false, pinned: false, unreadCount: 0, muted: false, tags: ['商人', 'NPC'],
  },
  {
    id: 'c7', name: '秦沐瑶', avatar: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    avatarType: 'gradient', bio: '音乐学院学生，同时也是异能者',
    region: '京海市·大学城', phone: '138-0000-0007',
    lastMessage: '下周五有我的演奏会', lastMessageTime: '周五',
    online: true, pinned: false, unreadCount: 1, muted: false, tags: ['好友', 'NPC'],
  },
  {
    id: 'c8', name: '黑鲨', avatar: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
    avatarType: 'gradient', bio: '地下格斗场冠军，话少但靠谱',
    region: '地下城·竞技区', phone: '138-0000-0008',
    lastMessage: '嗯', lastMessageTime: '上周四',
    online: false, pinned: false, unreadCount: 0, muted: false, tags: ['盟友', 'NPC'],
  },
  {
    id: 'c9', name: '梅姨', avatar: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    avatarType: 'gradient', bio: '老街茶馆老板娘，消息灵通',
    region: '京海市·老街', phone: '138-0000-0009',
    lastMessage: '昨天又有人在打探你的消息', lastMessageTime: '周三',
    online: true, pinned: false, unreadCount: 0, muted: false, tags: ['情报源', 'NPC'],
  },
  {
    id: 'c10', name: '云端', avatar: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
    avatarType: 'gradient', bio: '来历不明的AI程序，自称来自未来',
    region: '???', phone: '未知',
    lastMessage: '我在系统中发现了异常数据', lastMessageTime: '昨天',
    online: true, pinned: false, unreadCount: 3, muted: false, tags: ['神秘', 'AI角色'],
  },
];

export const tagColors: Record<string, string> = {
  '冒险伙伴': '#07C160',
  'NPC': '#576B95',
  '情报源': '#FA5151',
  '关键人物': '#FFC300',
  '好友': '#1989FA',
  '商人': '#FF9760',
  '盟友': '#07C160',
  '神秘': '#9C27B0',
  'AI角色': '#00BCD4',
};

export const tagGroups: Record<string, string[]> = {
  '星标好友': ['c1', 'c2'],
  '冒险伙伴': ['c1', 'c3'],
  '情报网络': ['c2', 'c9'],
  '京海市': ['c1', 'c4', 'c5', 'c6', 'c7', 'c9'],
};
