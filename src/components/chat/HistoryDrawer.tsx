import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import Drawer from '../shared/Drawer';
import { GitBranch, Clock, Trash2, BookOpen, Plus } from 'lucide-react';
import { createDefaultEntry } from '../../sillytavern/editor-utils';
import type { LorebookEntry } from '../../sillytavern/types';

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

  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [newEntryRole, setNewEntryRole] = useState<'user' | 'assistant'>('assistant');

  if (!chat) return null;

  const contact = contacts.find(c => c.id === chat.contactId);
  const characterName = contact?.name || 'AI';
  const historyBookId = `lb-history-${chat.contactId}`;
  const historyBook = lorebooks.find(lb => lb.id === historyBookId);

  const handleBacktrack = (messageId: string) => {
    backtrackTo(messageId);
    toggleHistoryDrawer();
  };

  const handleDelete = (messageId: string) => {
    deleteMessage(chat.id, messageId);
  };

  const handleAddEntry = async () => {
    if (!newEntryContent.trim()) return;

    if (!historyBook) return;

    const entry = createDefaultEntry();
    entry.keys = [
      newEntryRole === 'user' ? '用户' : characterName,
      '对话', '聊天记录', '历史',
      newEntryRole === 'user' ? 'role-user' : 'role-assistant',
    ];
    entry.content = `【${newEntryRole === 'user' ? '👤 ' + (settings.userName || '用户') : '🤖 ' + characterName} · ${new Date().toLocaleString('zh-CN')}】\n${newEntryContent.trim()}`;
    entry.order = Date.now();
    entry.constant = true;
    entry.position = 'after_char';

    const updatedBook = {
      ...historyBook,
      entries: [...historyBook.entries, entry],
      updatedAt: Date.now(),
    };
    updateLorebook(updatedBook);
    setNewEntryContent('');
    setShowAddEntry(false);
  };

  const handleOpenLorebook = () => {
    // Close drawer and navigate to profile/lorebook
    toggleHistoryDrawer();
  };

  return (
    <Drawer open={showHistoryDrawer} onClose={toggleHistoryDrawer} title="对话记录" side="left" width="w-80">
      <div className="p-3">
        {/* Info banner */}
        <div className="bg-wechat-green-light rounded-md p-2.5 mb-3">
          <div className="flex items-start gap-2">
            <BookOpen size={14} className="text-wechat-green mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-small text-wechat-green font-medium">对话记录已保存在世界书中</p>
              <p className="text-small text-wechat-text-gray mt-0.5">
                所有对话内容都会作为世界书条目供 AI 读取。你可以在「我 → 世界书管理」中编辑或删除对话记录。
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-small text-wechat-text-gray">
            共 {chat.messages.length} 条消息
          </span>
          <button
            id="add-history-entry-btn"
            onClick={() => setShowAddEntry(!showAddEntry)}
            className="flex items-center gap-1 text-small text-wechat-green hover:text-wechat-green-dark transition-colors"
          >
            <Plus size={12} /> 添加记录
          </button>
        </div>

        {/* Add entry form */}
        {showAddEntry && (
          <div className="mb-3 p-3 bg-wechat-bg rounded-md space-y-2">
            <div className="flex gap-2">
              <select
                value={newEntryRole}
                onChange={e => setNewEntryRole(e.target.value as 'user' | 'assistant')}
                className="text-small px-2 py-1 rounded bg-white border border-wechat-divider outline-none"
              >
                <option value="assistant">🤖 {characterName}</option>
                <option value="user">👤 {settings.userName || '用户'}</option>
              </select>
            </div>
            <textarea
              value={newEntryContent}
              onChange={e => setNewEntryContent(e.target.value)}
              placeholder="输入要添加的对话内容..."
              rows={3}
              className="w-full px-3 py-2 bg-white rounded-md text-body outline-none resize-none text-small"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddEntry}
                disabled={!newEntryContent.trim()}
                className="px-3 py-1.5 bg-wechat-green text-white rounded-md text-small font-medium hover:bg-wechat-green-dark transition-colors disabled:opacity-50"
              >
                添加
              </button>
              <button
                onClick={() => { setShowAddEntry(false); setNewEntryContent(''); }}
                className="px-3 py-1.5 bg-gray-200 rounded-md text-small hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* Message list */}
        {chat.messages.map((msg, idx) => (
          <div
            key={msg.id}
            id={`history-msg-${msg.id}`}
            className="w-full flex items-start gap-2 p-2 rounded-md hover:bg-wechat-bg transition-colors border-b border-wechat-divider last:border-0"
          >
            <button
              onClick={() => handleBacktrack(msg.id)}
              className="flex-1 flex items-start gap-2 text-left min-w-0"
            >
              <div className="flex-shrink-0 mt-0.5">
                {msg.role === 'assistant' ? (
                  <div className="w-5 h-5 rounded-full bg-wechat-green flex items-center justify-center text-white text-[9px]">AI</div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-wechat-text-secondary flex items-center justify-center text-white text-[9px]">我</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-small font-medium">{msg.role === 'assistant' ? characterName : (settings.userName || '我')}</span>
                  <span className="text-small text-wechat-text-light flex items-center gap-0.5">
                    <Clock size={9} />
                    {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-small text-wechat-text-light ml-auto">#{idx + 1}</span>
                </div>
                <p className="text-small text-wechat-text-gray truncate">{msg.content.slice(0, 50)}</p>
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

        {/* Open lorebook manager hint */}
        <div className="mt-4 pt-3 border-t border-wechat-divider">
          <p className="text-small text-wechat-text-light leading-relaxed">
            💡 提示：前往 <span className="text-wechat-green font-medium">我 → 世界书管理</span>，找到「{historyBook?.name || `对话记录 - ${characterName}`}」即可查看和编辑完整的对话记录。编辑内容会实时反映到聊天界面。
          </p>
        </div>
      </div>
    </Drawer>
  );
}
