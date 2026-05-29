import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import type { ChatEntry } from '../../sillytavern/types';
import {
  Smile, Send, Plus, X,
  Mic, Video, Image as ImageIcon,
  DollarSign, FileText, MapPin, MessageSquare,
} from 'lucide-react';

type MsgType = 'text' | 'voice' | 'video' | 'image' | 'transfer' | 'document' | 'location';

interface TypeOption {
  type: MsgType;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  { type: 'text', label: '文字', icon: <MessageSquare size={18} />, color: '#07C160' },
  { type: 'voice', label: '语音', icon: <Mic size={18} />, color: '#F97316' },
  { type: 'video', label: '视频', icon: <Video size={18} />, color: '#3B82F6' },
  { type: 'image', label: '图片', icon: <ImageIcon size={18} />, color: '#8B5CF6' },
  { type: 'transfer', label: '转账', icon: <DollarSign size={18} />, color: '#F56C2D' },
  { type: 'document', label: '文件', icon: <FileText size={18} />, color: '#607D8B' },
  { type: 'location', label: '定位', icon: <MapPin size={18} />, color: '#FA5151' },
];

export default function ChatInput() {
  const sendMessage = useAppStore(s => s.sendMessage);
  const isStreaming = useAppStore(s => s.isStreaming);
  const activeChat = useAppStore(s => s.activeChat);

  const [input, setInput] = useState('');
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [activeType, setActiveType] = useState<MsgType>('text');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Type-specific form state
  const [duration, setDuration] = useState('5');
  const [amount, setAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [address, setAddress] = useState('');
  const [showTypeForm, setShowTypeForm] = useState(false);

  const hasText = input.trim().length > 0;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [input]);

  // Close menu on outside click
  useEffect(() => {
    if (!showTypeMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowTypeMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTypeMenu]);

  // Reset type-specific form when switching type
  const selectType = useCallback((type: MsgType) => {
    setActiveType(type);
    setShowTypeMenu(false);
    if (type === 'text') {
      setShowTypeForm(false);
    } else {
      setShowTypeForm(true);
    }
  }, []);

  const handleSend = async () => {
    if (isStreaming) return;

    if (activeType === 'text') {
      const text = input.trim();
      if (!text) return;
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      await sendMessage(text);
    } else {
      // Build typed ChatEntry
      const entry = buildChatEntry();
      if (!entry) return;
      const displayContent = entry.content || getPlaceholderContent();
      setInput('');
      setShowTypeForm(false);
      setActiveType('text');
      await sendMessage(displayContent, entry);
    }
  };

  const buildChatEntry = (): ChatEntry | null => {
    const content = input.trim() || getPlaceholderContent();
    let entry: ChatEntry = { type: activeType, content };

    switch (activeType) {
      case 'voice':
        entry.duration = Number(duration) || 5;
        break;
      case 'video':
        entry.duration = Number(duration) || 30;
        break;
      case 'image':
        break;
      case 'transfer':
        entry.amount = Number(amount) || 0;
        if (amount && Number(amount) <= 0) return null;
        if (transferNote.trim()) entry.transferNote = transferNote.trim();
        break;
      case 'document':
        if (fileName.trim()) entry.fileName = fileName.trim();
        if (fileSize.trim()) entry.fileSize = fileSize.trim();
        break;
      case 'location':
        if (address.trim()) entry.address = address.trim();
        break;
    }

    return entry;
  };

  const getPlaceholderContent = (): string => {
    switch (activeType) {
      case 'voice': return '语音消息';
      case 'video': return '视频通话';
      case 'image': return '[图片]';
      case 'transfer': return transferNote.trim() || '转账';
      case 'document': return fileName.trim() || '[文件]';
      case 'location': return address.trim() || '[位置]';
      default: return '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const cancelTypeForm = () => {
    setShowTypeForm(false);
    setActiveType('text');
    setInput('');
  };

  if (!activeChat()) {
    return null;
  }

  return (
    <div className="border-t border-wechat-divider bg-[#F7F7F7]">
      {/* Type form overlay — shows when a non-text type is selected */}
      {showTypeForm && (
        <div className="px-4 py-2.5 border-b border-wechat-divider bg-white animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: TYPE_OPTIONS.find(o => o.type === activeType)?.color + '20' }}>
                {TYPE_OPTIONS.find(o => o.type === activeType)?.icon && (
                  <span style={{ color: TYPE_OPTIONS.find(o => o.type === activeType)?.color }}>
                    {renderSmallIcon(activeType)}
                  </span>
                )}
              </span>
              <span className="text-[13px] font-medium text-wechat-text">
                {TYPE_OPTIONS.find(o => o.type === activeType)?.label}
              </span>
            </div>
            <button onClick={cancelTypeForm} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <X size={15} className="text-wechat-text-light" />
            </button>
          </div>
          {renderTypeForm()}
        </div>
      )}

      {/* Main input area */}
      <div className="px-3 py-2.5 flex items-end gap-2">
        {/* "+" button */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            className={`p-1.5 rounded-lg transition-all duration-200 flex-shrink-0 ${
              showTypeMenu ? 'bg-gray-200 rotate-45' : 'hover:bg-gray-100'
            }`}
            onClick={() => setShowTypeMenu(!showTypeMenu)}
            disabled={isStreaming}
            title="更多消息类型"
          >
            <Plus size={20} className="text-wechat-text-gray" />
          </button>

          {/* Type menu popover */}
          {showTypeMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-100 p-2 z-50 animate-scaleIn">
              <div className="grid grid-cols-3 gap-1.5 w-[200px]">
                {TYPE_OPTIONS.filter(o => o.type !== 'text').map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => selectType(opt.type)}
                    className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: opt.color + '15' }}>
                      <span style={{ color: opt.color }}>{opt.icon}</span>
                    </div>
                    <span className="text-[10px] text-wechat-text-light font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Text input area */}
        <div className={`flex-1 rounded-lg px-3 py-2 transition-all duration-200 ${
          activeType !== 'text' ? 'bg-white border border-wechat-green/30' : 'bg-white'
        }`}>
          {activeType !== 'text' && !showTypeForm && (
            <div
              className="text-[13px] text-wechat-green font-medium mb-1 cursor-pointer"
              onClick={() => setShowTypeForm(true)}
            >
              {TYPE_OPTIONS.find(o => o.type === activeType)?.label} ·
              <span className="text-wechat-text-light font-normal ml-1">点击编辑详情</span>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeType === 'text' ? '输入消息...' : getTypePlaceholder()}
            rows={1}
            className="w-full bg-transparent outline-none text-[15px] resize-none placeholder:text-wechat-text-light/60"
            disabled={isStreaming}
          />
        </div>

        {/* Emoji + Send */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {activeType === 'text' && (
            <button
              className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              disabled={isStreaming}
            >
              <Smile size={20} className="text-wechat-text-gray" />
            </button>
          )}

          {isStreaming ? (
            <button
              className="p-1.5 flex-shrink-0 cursor-pointer hover:bg-gray-100 rounded transition-colors"
              title="AI 回复中..."
            >
              <div className="w-5 h-5 rounded-sm bg-wechat-danger animate-pulse" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={activeType === 'text' ? !hasText : false}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-90 ${
                (activeType === 'text' ? hasText : true)
                  ? 'bg-wechat-green hover:bg-wechat-green-dark'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
              title={activeType === 'text' ? '发送 (Enter)' : '发送'}
            >
              <Send size={16} className="text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ── Helpers ──

  function getTypePlaceholder(): string {
    switch (activeType) {
      case 'voice': return '输入语音转文字内容...';
      case 'video': return '输入视频通话描述...';
      case 'image': return '输入图片描述...';
      case 'transfer': return '输入转账留言...';
      case 'document': return '输入文件说明...';
      case 'location': return '输入定位说明...';
      default: return '输入消息...';
    }
  }

  function renderTypeForm() {
    switch (activeType) {
      case 'voice':
        return (
          <div className="flex items-center gap-3">
            <label className="text-[12px] text-wechat-text-light whitespace-nowrap">时长(秒):</label>
            <input
              type="number" min={1} max={60} value={duration}
              onChange={e => setDuration(e.target.value)}
              className="w-16 px-2 py-1 text-[13px] border border-gray-200 rounded focus:outline-none focus:border-wechat-green"
            />
            <span className="text-[11px] text-wechat-text-light/50">语音气泡会显示波形和时长</span>
          </div>
        );
      case 'video':
        return (
          <div className="flex items-center gap-3">
            <label className="text-[12px] text-wechat-text-light whitespace-nowrap">时长(秒):</label>
            <input
              type="number" min={1} max={3600} value={duration}
              onChange={e => setDuration(e.target.value)}
              className="w-16 px-2 py-1 text-[13px] border border-gray-200 rounded focus:outline-none focus:border-wechat-green"
            />
            <span className="text-[11px] text-wechat-text-light/50">视频气泡会显示通话时长</span>
          </div>
        );
      case 'image':
        return (
          <div className="text-[12px] text-wechat-text-light/60">
            图片消息会显示为带缩略图的气泡。在输入框中描述图片内容。
          </div>
        );
      case 'transfer':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <label className="text-[12px] text-wechat-text-light whitespace-nowrap">金额(¥):</label>
              <input
                type="number" min={0.01} step={0.01} value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-24 px-2 py-1 text-[13px] border border-gray-200 rounded focus:outline-none focus:border-wechat-green"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-[12px] text-wechat-text-light whitespace-nowrap">备注:</label>
              <input
                type="text" value={transferNote}
                onChange={e => setTransferNote(e.target.value)}
                placeholder="转账说明..."
                className="flex-1 px-2 py-1 text-[13px] border border-gray-200 rounded focus:outline-none focus:border-wechat-green"
              />
            </div>
          </div>
        );
      case 'document':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <label className="text-[12px] text-wechat-text-light whitespace-nowrap">文件名:</label>
              <input
                type="text" value={fileName}
                onChange={e => setFileName(e.target.value)}
                placeholder="文档.pdf"
                className="flex-1 px-2 py-1 text-[13px] border border-gray-200 rounded focus:outline-none focus:border-wechat-green"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-[12px] text-wechat-text-light whitespace-nowrap">大小:</label>
              <input
                type="text" value={fileSize}
                onChange={e => setFileSize(e.target.value)}
                placeholder="2.4MB"
                className="w-24 px-2 py-1 text-[13px] border border-gray-200 rounded focus:outline-none focus:border-wechat-green"
              />
            </div>
          </div>
        );
      case 'location':
        return (
          <div className="flex items-center gap-3">
            <label className="text-[12px] text-wechat-text-light whitespace-nowrap">地址:</label>
            <input
              type="text" value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="京海市老城区晨曦侦探社"
              className="flex-1 px-2 py-1 text-[13px] border border-gray-200 rounded focus:outline-none focus:border-wechat-green"
            />
          </div>
        );
      default:
        return null;
    }
  }

  function renderSmallIcon(type: MsgType) {
    const opt = TYPE_OPTIONS.find(o => o.type === type);
    return opt?.icon;
  }
}
