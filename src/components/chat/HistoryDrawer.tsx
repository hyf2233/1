import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import Drawer from '../shared/Drawer';
import {
  GitBranch, Clock, Trash2, BookOpen, Plus, X,
  MessageSquare, Mic, Video, ImageIcon,
  DollarSign, FileText, MapPin,
} from 'lucide-react';
import { createDefaultEntry, chatEntryToXml } from '../../sillytavern/editor-utils';
import type { ChatEntryType, ChatEntry } from '../../sillytavern/types';

interface TypeOption {
  type: ChatEntryType;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  { type: 'text',      label: '文字', icon: <MessageSquare size={12} />, color: '#07C160', bgColor: '#E8F8EF' },
  { type: 'voice',     label: '语音', icon: <Mic size={12} />,           color: '#FF9760', bgColor: '#FFF3ED' },
  { type: 'video',     label: '视频', icon: <Video size={12} />,         color: '#576B95', bgColor: '#EEF1F7' },
  { type: 'image',     label: '图片', icon: <ImageIcon size={12} />,     color: '#1485EE', bgColor: '#E8F2FD' },
  { type: 'transfer',  label: '转账', icon: <DollarSign size={12} />,    color: '#FA9D3B', bgColor: '#FFF6EF' },
  { type: 'document',  label: '文件', icon: <FileText size={12} />,      color: '#576B95', bgColor: '#EEF1F7' },
  { type: 'location',  label: '定位', icon: <MapPin size={12} />,        color: '#FA5151', bgColor: '#FDEDED' },
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
  const showToast = useAppStore(s => s.showToast);
  const chat = activeChat();

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addRole, setAddRole] = useState<'user' | 'assistant'>('assistant');
  const [addType, setAddType] = useState<ChatEntryType>('text');
  const [addContent, setAddContent] = useState('');
  const [addDuration, setAddDuration] = useState<number | ''>('');
  const [addAmount, setAddAmount] = useState<number | ''>('');
  const [addNote, setAddNote] = useState('');
  const [addFileName, setAddFileName] = useState('');
  const [addFileSize, setAddFileSize] = useState('');
  const [addAddress, setAddAddress] = useState('');
  const [addTime, setAddTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

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
    if (deleteMessage && chat) {
      deleteMessage(chat.id, messageId);
      showToast('消息已删除');
    }
  };

  const handleAddEntry = () => {
    if (!addContent.trim()) return;
    if (!historyBook) return;

    const isUser = addRole === 'user';
    const roleName = isUser ? userName : characterName;
    const roleEmoji = isUser ? '👤' : '🤖';
    const now = new Date();
    const timeStr = now.toLocaleString('zh-CN');
    const header = `【${roleEmoji} ${roleName} · ${timeStr}】`;

    // Build ChatEntry object from form fields
    const chatEntry: ChatEntry = {
      type: addType,
      content: addContent.trim(),
      time: addTime || undefined,
      duration: addDuration ? Number(addDuration) : undefined,
      amount: addAmount ? Number(addAmount) : undefined,
      transferNote: addNote || undefined,
      fileName: addFileName || undefined,
      fileSize: addFileSize || undefined,
      address: addAddress || undefined,
    };

    // Generate proper XML using chatEntryToXml (same format as auto-generated entries)
    const contentBody = chatEntryToXml(chatEntry);

    const entry = createDefaultEntry();
    entry.keys = [roleName];
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
    showToast('消息已添加到对话中');
  };

  const resetForm = () => {
    setAddContent('');
    setAddDuration('');
    setAddAmount('');
    setAddNote('');
    setAddFileName('');
    setAddFileSize('');
    setAddAddress('');
    const now = new Date();
    setAddTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    setAddType('text');
    setAddRole('assistant');
    setShowAddForm(false);
  };

  const selectedType = TYPE_OPTIONS.find(t => t.type === addType);

  return (
    <Drawer open={showHistoryDrawer} onClose={toggleHistoryDrawer} title="对话记录" side="left" width="w-84">
      <div className="p-3 flex flex-col h-full">
        {/* Info banner */}
        <div className="bg-wechat-green-light rounded-lg p-3 mb-3 flex-shrink-0">
          <div className="flex items-start gap-2">
            <BookOpen size={15} className="text-wechat-green mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[13px] text-wechat-green font-semibold">对话保存于世界书</p>
              <p className="text-[11px] text-wechat-text-gray mt-1 leading-relaxed">
                所有对话自动同步到世界书「{historyBook?.name || `聊天记录-${characterName}`}」。AI 可读取这些记录作为上下文。
              </p>
            </div>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <span className="text-[12px] text-wechat-text-gray">
            {chat.messages.length} 条消息 · 世界书 {historyBook?.entries.length || 0} 条
          </span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center gap-1.5 text-[12px] font-medium transition-all duration-200 px-2.5 py-1 rounded-full ${
              showAddForm
                ? 'bg-red-50 text-wechat-danger'
                : 'bg-wechat-green-light text-wechat-green hover:bg-wechat-green/10'
            }`}
          >
            {showAddForm ? <X size={12} /> : <Plus size={12} />}
            {showAddForm ? '取消' : '添加记录'}
          </button>
        </div>

        {/* Add entry form */}
        {showAddForm && (
          <div className="mb-3 p-3 bg-gray-50/80 rounded-xl space-y-3 flex-shrink-0 border border-gray-100 animate-scaleIn">
            {/* Role + Type row */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-wechat-text-gray w-8 flex-shrink-0">角色</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setAddRole('assistant')}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 ${
                    addRole === 'assistant'
                      ? 'bg-wechat-green text-white shadow-sm shadow-wechat-green/20'
                      : 'bg-white text-wechat-text-gray hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {characterName}
                </button>
                <button
                  onClick={() => setAddRole('user')}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 ${
                    addRole === 'user'
                      ? 'bg-wechat-text-secondary text-white shadow-sm'
                      : 'bg-white text-wechat-text-gray hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {userName}
                </button>
              </div>
            </div>

            {/* Type selector */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-wechat-text-gray w-8 flex-shrink-0">类型</span>
              <div className="flex flex-wrap gap-1.5">
                {TYPE_OPTIONS.map(t => (
                  <button
                    key={t.type}
                    onClick={() => setAddType(t.type)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 active:scale-95 ${
                      addType === t.type
                        ? 'text-white shadow-sm'
                        : 'bg-white text-wechat-text-gray hover:bg-gray-100 border border-gray-200'
                    }`}
                    style={addType === t.type ? { background: t.color } : {}}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time input */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-wechat-text-gray w-8">时间</span>
              <input
                type="text" placeholder="14:30"
                value={addTime} onChange={e => setAddTime(e.target.value)}
                className="w-24 px-2.5 py-1.5 bg-white rounded-lg text-[13px] outline-none border border-gray-200 focus:border-wechat-green focus:ring-1 focus:ring-wechat-green/20 transition-all"
              />
              <span className="text-[11px] text-wechat-text-light">HH:MM</span>
            </div>

            {/* Type-specific fields */}
            {(addType === 'voice' || addType === 'video') && (
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-wechat-text-gray w-8">时长</span>
                <input
                  type="number" min={1} placeholder="秒数"
                  value={addDuration} onChange={e => setAddDuration(e.target.value ? Number(e.target.value) : '')}
                  className="w-24 px-2.5 py-1.5 bg-white rounded-lg text-[13px] outline-none border border-gray-200 focus:border-wechat-green focus:ring-1 focus:ring-wechat-green/20 transition-all"
                />
                <span className="text-[11px] text-wechat-text-light">秒</span>
              </div>
            )}
            {addType === 'transfer' && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-wechat-text-gray w-8">金额</span>
                  <input type="number" min={0} step={0.01} placeholder="0.00"
                    value={addAmount} onChange={e => setAddAmount(e.target.value ? Number(e.target.value) : '')}
                    className="w-32 px-2.5 py-1.5 bg-white rounded-lg text-[13px] outline-none border border-gray-200 focus:border-wechat-green focus:ring-1 focus:ring-wechat-green/20 transition-all" />
                  <span className="text-[11px] text-wechat-text-light">元</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-wechat-text-gray w-8">备注</span>
                  <input type="text" placeholder="转账备注" value={addNote}
                    onChange={e => setAddNote(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white rounded-lg text-[13px] outline-none border border-gray-200 focus:border-wechat-green focus:ring-1 focus:ring-wechat-green/20 transition-all" />
                </div>
              </div>
            )}
            {addType === 'document' && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-wechat-text-gray w-8">文件名</span>
                  <input type="text" placeholder="文件名.pdf" value={addFileName}
                    onChange={e => setAddFileName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white rounded-lg text-[13px] outline-none border border-gray-200 focus:border-wechat-green focus:ring-1 focus:ring-wechat-green/20 transition-all" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-wechat-text-gray w-8">大小</span>
                  <input type="text" placeholder="2.4MB" value={addFileSize}
                    onChange={e => setAddFileSize(e.target.value)}
                    className="w-28 px-2.5 py-1.5 bg-white rounded-lg text-[13px] outline-none border border-gray-200 focus:border-wechat-green focus:ring-1 focus:ring-wechat-green/20 transition-all" />
                </div>
              </div>
            )}
            {addType === 'location' && (
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-wechat-text-gray w-8">地址</span>
                <input type="text" placeholder="详细地址" value={addAddress}
                  onChange={e => setAddAddress(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white rounded-lg text-[13px] outline-none border border-gray-200 focus:border-wechat-green focus:ring-1 focus:ring-wechat-green/20 transition-all" />
              </div>
            )}

            {/* Content */}
            <div>
              <textarea
                value={addContent} onChange={e => setAddContent(e.target.value)}
                placeholder={
                  addType === 'voice' ? '语音消息的内容...' :
                  addType === 'video' ? '视频通话描述...' :
                  addType === 'transfer' ? '转账留言...' :
                  addType === 'location' ? '定位说明...' :
                  '消息内容...'
                }
                rows={3}
                className="w-full px-3 py-2 bg-white rounded-lg text-[13px] outline-none resize-none border border-gray-200 focus:border-wechat-green focus:ring-1 focus:ring-wechat-green/20 transition-all"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleAddEntry}
                disabled={!addContent.trim()}
                className="flex-1 py-2 rounded-lg text-[13px] font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: selectedType?.color || '#07C160' }}
              >
                添加此消息
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 rounded-lg text-[13px] text-wechat-text-gray bg-gray-200 hover:bg-gray-300 transition-all duration-200"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* Message list */}
        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {chat.messages.map((msg, idx) => (
            <div
              key={msg.id}
              className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 transition-all duration-150 cursor-pointer group/item"
              onClick={() => handleBacktrack(msg.id)}
            >
              <div className="flex-shrink-0 mt-0.5">
                {msg.role === 'assistant' ? (
                  <div className="w-6 h-6 rounded-full bg-wechat-green flex items-center justify-center text-white text-[10px] font-bold shadow-sm shadow-wechat-green/20">
                    {characterName[0]}
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-wechat-text-secondary flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                    {userName[0]}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-semibold">
                    {msg.role === 'assistant' ? characterName : userName}
                  </span>
                  <span className="text-[10px] text-wechat-text-light/60 flex items-center gap-1">
                    <Clock size={9} />
                    {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[10px] text-wechat-text-light/40 ml-auto">#{idx + 1}</span>
                </div>
                <p className="text-[12px] text-wechat-text-gray truncate mt-0.5 leading-relaxed">
                  {msg.content.slice(0, 80)}
                </p>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0 mt-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150">
                <button onClick={(e) => { e.stopPropagation(); handleBacktrack(msg.id); }}
                  className="p-1 rounded hover:bg-wechat-green-light hover:text-wechat-green transition-all" title="回溯">
                  <GitBranch size={11} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }}
                  className="p-1 rounded hover:bg-red-50 hover:text-wechat-danger transition-all" title="删除">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex-shrink-0">
          <p className="text-[11px] text-wechat-text-light/60 leading-relaxed">
            前往 <span className="text-wechat-green font-semibold">我 → 世界书管理</span> 编辑「{historyBook?.name || `聊天记录-${characterName}`}」可实时修改聊天内容
          </p>
        </div>
      </div>
    </Drawer>
  );
}
