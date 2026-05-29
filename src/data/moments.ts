// src/data/moments.ts
import type { Moment } from '../types';

export const presetMoments: Moment[] = [
  {
    id: 'm1',
    authorId: 'c1', authorName: '苏晓月', authorAvatar: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    content: '今天的遗迹探险收获颇丰，找到了第三块符文碎片。距离解开北境封印又近了一步。感谢我的搭档们！',
    likes: ['c3', 'c7', 'c9'],
    comments: [
      { id: 'cm1', authorId: 'c3', authorName: '林若雪', content: '下次一起，北境的遗迹我最熟', createdAt: '1小时前' },
      { id: 'cm2', authorId: 'c7', authorName: '秦沐瑶', content: '好厉害！我也想学考古！', createdAt: '30分钟前' },
    ],
    createdAt: '2小时前',
    location: '北境·古代遗迹',
  },
  {
    id: 'm2',
    authorId: 'c2', authorName: '白夜', authorAvatar: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    content: '最近京海市不太平。有人在地下市场兜售"禁术卷轴"。各位小心行事。',
    likes: ['c1', 'c5', 'c8'],
    comments: [
      { id: 'cm3', authorId: 'c5', authorName: '顾晨曦', content: '我也注意到了。晚上来我办公室详谈。', createdAt: '3小时前' },
    ],
    createdAt: '5小时前',
  },
  {
    id: 'm3',
    authorId: 'c5', authorName: '顾晨曦', authorAvatar: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    content: '新案子：老城区连续三起离奇失踪案。现场都有相同的符文图案。有意思。',
    likes: ['c2', 'c4'],
    comments: [],
    createdAt: '昨天',
    location: '京海市·老城区',
  },
  {
    id: 'm4',
    authorId: 'c7', authorName: '秦沐瑶', authorAvatar: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    content: '下周五晚上7点，京海音乐厅，我的个人演奏会！曲目包括一些...特别的乐章。期待大家光临！',
    likes: ['c1', 'c3', 'c5', 'c6', 'c9'],
    comments: [
      { id: 'cm4', authorId: 'c6', authorName: '赵铁柱', content: '姑娘，包场了！', createdAt: '昨天' },
      { id: 'cm5', authorId: 'c1', authorName: '苏晓月', content: '一定到！你的音乐一直是我的灵感来源', createdAt: '昨天' },
    ],
    createdAt: '昨天',
    location: '京海市·音乐厅',
  },
  {
    id: 'm5',
    authorId: 'c10', authorName: '云端', authorAvatar: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
    content: '【系统日志 #2049】检测到时空异常波动。坐标：京海市·旧码头。时间：48小时内。建议：不要去。但我知道你们一定会去。',
    likes: ['c1', 'c2', 'c5'],
    comments: [
      { id: 'cm6', authorId: 'c2', authorName: '白夜', content: '......你怎么知道这个坐标的？', createdAt: '2天前' },
    ],
    createdAt: '2天前',
    location: '???',
  },
];
