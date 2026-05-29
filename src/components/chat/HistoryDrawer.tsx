import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import Drawer from '../shared/Drawer';
import { GitBranch, Clock, Trash2, BookOpen, Plus, X, MessageCircle, Mic, Video, Image } from 'lucide-react';
import { createDefaultEntry } from '../../sillytavern/editor-utils';
import type { LorebookEntry } from '../../sillytavern/types';

type MsgType = 'text' | 'voice' | 'video' | 'image';

const TYPE_CONFIG: { type: MsgType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'text', label: '文字', icon: <MessageCircle size={12} />, color: '#07C160' },
  { type: 'voice', label: '语音', icon: <Mic size={12} />, color: '#FF9760' },
  { type: 'video', label: '视频', icon: <Video size={12} />, color: '#576B95' },
  { type: 'image', label: '图片', icon: <Image size={12} />, color: '#FA5151' },
];

export default function HistoryDrawer() {
  const showHistoryDrawer = useAppStore(s => s.showHistoryDrawer);
  const toggleHistoryDrawer = useAppStore(s => s.toggleHistoryDrawer);
  const activeChat = useAppStore(s => s.activeChat);
  const backtrackTo = useAppStore(s => s.backtrackTo);
  const deleteMessage = useAppStore(s => s.deleteMessage);
  const lorebooks = useAppStore(s => s.lorebooks);
  const updateLorebook = useAppStore(s => s.updateLorebook);
  const settings = useAppStore(s => s.settings);
  const contacts = useAppStore(s => s.contacts);
  const chat = activeChat();

  // Add entry form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntryRole, setNewEntryRole] = useState<'user' | 'assistant'>('assistant');
  const [newEntryType, setNewEntryType] = useState<MsgType>('text');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [newEntryDuration, setNewEntryDuration] = useState<number | ''>('');

  if (!chat) return null;

  const contact = contacts.find(c => c.id === chat.contactId);
  const characterName = contact?.name || 'AI';
  const userName = settings.userName || '用户';
  const historyBookId = `lb-history-${chat.contactId}`;
  const historyBook = lorebooks.find(lb => lb.id === historyBookId);

  const handleBacktrack = (messageId: string) => {
    backtrackTo(messageId);
    toggleHistoryDrawer();
  };

  const handleDelete = (messageId: string) => {
    if (confirm('确定删除这条消息？同时会从世界书中移除对应条目。')) {
      deleteMessage(chat.id, messageId);
    }
  };

  const handleAddEntry = () => {
    if (!newEntryContent.trim()) return;
    if (!historyBook) return;

    const roleEmoji = newEntryRole === 'user' ? '👤' : '🤖';
    const roleName = newEntryRole === 'user' ? userName : characterName;
    const timeStr = new Date().toLocaleString('zh-CN');
    const header = `【${roleEmoji} ${roleName} · ${timeStr}】`;

    // Build content body with type info
    let contentBody: string;
    switch (newEntryType) {
      case 'voice':
        contentBody = `[🎤语音]${newEntryDuration ? ` (${newEntryDuration}秒)` : ''} ${newEntryContent.trim()}`;
        break;
      case 'video':
        contentBody = `[📹视频]${newEntryDuration ? ` (${newEntryDuration}秒)` : ''} ${newEntryContent.trim()}`;
        break;
      case 'image':
        contentBody = `[🖼图片] ${newEntryContent.trim()}`;
        break;
      default:
        contentBody = newEntryContent.trim();
    }

    const entry = createDefaultEntry();
    entry.keys = [
      roleName,
      newEntryRole === 'user' ? 'role-user' : 'role-assistant',
      '对话', '聊天记录', '历史', '手动添加',
      `type-${newEntryType}`,
    ];
    entry.content = `${header}\n${contentBody}`;
    entry.order = Date.now();
    entry.constant = true;
    entry.position = 'after_char';

    const updatedBook = {
      ...historyBook,
      entries: [...historyBook.entries, entry],
      updatedAt: Date.now(),
    };
    updateLorebook(updatedBook);
    resetForm();
  };

  const resetForm = () => {
    setNewEntryContent('');
    setNewEntryDuration('');
    setNewEntryType('text');
    setNewEntryRole('assistant');
    setShowAddForm(false);
  };

  return (
    <Drawer open={showHistoryDrawer} onClose={toggleHistoryDrawer} title="对话记录" side="left" width="w-80">
      <div className="p-3 flex flex-col h-full">
        {/* Info banner */}
        <div className="bg-wechat-green-light rounded-md p-2.5 mb-3 flex-shrink-0">
          <div className="flex items-start gap-2">
            <BookOpen size={14} className="text-wechat-green mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-small text-wechat-green font-medium">对话保存于世界书</p>
              <p className="text-small text-wechat-text-gray mt-0.5 leading-relaxed">
                所有对话自动同步到世界书「{historyBook?.name || `对话记录 - ${characterName}`}」。AI 可读取这些记录。你可以在「我 → 世界书管理」中自由编辑。
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <span className="text-small text-wechat-text-gray">
            共 {chat.messages.length} 条
            {historyBook && <span className="ml-1">· 世界书 {historyBook.entries.length} 条</span>}
          </span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center gap-1 text-small transition-colors ${
              showAddForm ? 'text-wechat-danger' : 'text-wechat-green hover:text-wechat-green-dark'
            }`}
          >
            {showAddForm ? <X size={12} /> : <Plus size={12} />}
            {showAddForm ? '取消' : '添加记录'}
          </button>
        </div>

        {/* Add entry form */}
        {showAddForm && (
          <div className="mb-3 p-3 bg-wechat-bg rounded-md space-y-2.5 flex-shrink-0">
            {/* Role selector */}
            <div className="flex items-center gap-2">
              <span className="text-small text-wechat-text-gray w-10">角色</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setNewEntryRole('assistant')}
                  className={`px-2.5 py-1 rounded-full text-small transition-colors ${
                    newEntryRole === 'assistant'
                      ? 'bg-wechat-green text-white'
                      : 'bg-white text-wechat-text-gray hover:bg-gray-100'
                  }`}
                >
                  🤖 {characterName}
                </button>
                <button
                  onClick={() => setNewEntryRole('user')}
                  className={`px-2.5 py-1 rounded-full text-small transition-colors ${
                    newEntryRole === 'user'
                      ? 'bg-wechat-green text-white'
                      : 'bg-white text-wechat-text-gray hover:bg-gray-100'
                  }`}
                >
                  👤 {userName}
                </button>
              </div>
            </div>

            {/* Type selector */}
            <div className="flex items-center gap-2">
              <span className="text-small text-wechat-text-gray w-10">类型</span>
              <div className="flex gap-1">
                {TYPE_CONFIG.map(t => (
                  <button
                    key={t.type}
                    onClick={() => setNewEntryType(t.type)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-small transition-colors ${
                      newEntryType === t.type
                        ? 'text-white'
                        : 'bg-white text-wechat-text-gray hover:bg-gray-100'
                    }`}
                    style={newEntryType === t.type ? { background: t.color } : {}}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration (for voice/video) */}
            {(newEntryType === 'voice' || newEntryType === 'video') && (
              <div className="flex items-center gap-2">
                <span className="text-small text-wechat-text-gray w-10">时长</span>
                <input
                  type="number"
                  value={newEntryDuration}
                  onChange={e => setNewEntryDuration(e.target.value ? Number(e.target.value) : '')}
                  placeholder="秒数（可选）"
                  min={1}
                  className="w-28 px-2 py-1 bg-white rounded text-small outline-none"
                />
                <span className="text-small text-wechat-text-light">秒</span>
              </div>
            )}

            {/* Content */}
            <div>
              <textarea
                value={newEntryContent}
                onChange={e => setNewEntryContent(e.target.value)}
                placeholder={
                  newEntryType === 'voice' ? '语音消息的文本描述...' :
                  newEntryType === 'video' ? '视频通话的描述...' :
                  newEntryType === 'image' ? '图片描述...' :
                  '消息内容...'
                }
                rows={3}
                className="w-full px-3 py-2 bg-white rounded-md text-body outline-none resize-none text-small"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleAddEntry}
                disabled={!newEntryContent.trim()}
                className="flex-1 py-1.5 bg-wechat-green text-white rounded-md text-small font-medium hover:bg-wechat-green-dark transition-colors disabled:opacity-50"
              >
                添加此条消息
              </button>
              <button
                onClick={resetForm}
                className="px-3 py-1.5 bg-gray-200 rounded-md text-small hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* Message list */}
        <div className="flex-1 overflow-y-auto">
          {chat.messages.map((msg, idx) => (
            <div
              key={msg.id}
              className="w-full flex items-start gap-2 p-2 rounded-md hover:bg-wechat-bg transition-colors border-b border-wechat-divider last:border-0"
            >
              <button
                onClick={() => handleBacktrack(msg.id)}
                className="flex-1 flex items-start gap-2 text-left min-w-0"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {msg.role === 'assistant' ? (
                    <div className="w-5 h-5 rounded-full bg-wechat-green flex items-center justify-center text-white text-[9px] font-medium">
                      {characterName[0]}
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-wechat-text-secondary flex items-center justify-center text-white text-[9px] font-medium">
                      {userName[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-small font-medium">
                      {msg.role === 'assistant' ? characterName : userName}
                    </span>
                    <span className="text-small text-wechat-text-light flex items-center gap-0.5">
                      <Clock size={9} />
                      {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-small text-wechat-text-light ml-auto">#{idx + 1}</span>
                  </div>
                  <p className="text-small text-wechat-text-gray truncate">{msg.content.slice(0, 60)}</p>
                </div>
              </button>
              <div className="flex flex-col gap-0.5 flex-shrink-0 mt-0.5">
                <button
                  onClick={() => handleBacktrack(msg.id)}
                  className="p-0.5 hover:text-wechat-green transition-colors"
                  title="回溯到此"
                >
                  <GitBranch size={12} className="text-wechat-text-light" />
                </button>
                <button
                  onClick={() => handleDelete(msg.id)}
                  className="p-0.5 hover:text-wechat-danger transition-colors"
                  title="删除消息"
                >
                  <Trash2 size={12} className="text-wechat-text-light" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="mt-3 pt-3 border-t border-wechat-divider flex-shrink-0">
          <p className="text-small text-wechat-text-light leading-relaxed">
            💡 前往 <span className="text-wechat-green font-medium">我 → 世界书管理</span>，编辑「{historyBook?.name || `对话记录 - ${characterName}`}」可实时修改聊天内容。删除世界书条目会从聊天中移除对应消息。
          </p>
        </div>
      </div>
    </Drawer>
  );
}
