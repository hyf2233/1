import { useState, useMemo } from 'react';
import type { ChatMessage, ChatEntry } from '../../types';
import {
  ChevronDown, ChevronRight, Brain, Trash2,
  Mic, Video, ImageIcon, MessageSquare,
  DollarSign, FileText, MapPin, Phone,
  Music, Play, Download, Navigation,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import Avatar from '../shared/Avatar';

interface Props {
  message: ChatMessage;
  avatarSrc?: string;
  avatarName?: string;
  avatarGradient?: string;
  showAvatar?: boolean;
  isConsecutive?: boolean;
  onBacktrack?: () => void;
  onDelete?: () => void;
}

export default function MessageBubble({
  message, avatarSrc, avatarName, avatarGradient,
  showAvatar = true, isConsecutive = false,
  onBacktrack, onDelete,
}: Props) {
  const isUser = message.role === 'user';
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const settings = useAppStore(s => s.settings);

  const timeStr = useMemo(() => formatMessageTime(message.timestamp), [message.timestamp]);

  // ── USER MESSAGE (right side, no avatar) ──
  if (isUser) {
    return (
      <div
        className={`flex justify-end items-start mb-0 message-enter px-4 ${isConsecutive ? 'message-consecutive' : 'mt-3'}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="max-w-[60%] group">
          {/* Time label above */}
          {!isConsecutive && (
            <div className="flex justify-end mb-1">
              <span className="text-[10px] text-wechat-text-light/70 font-medium tracking-wide">{timeStr}</span>
            </div>
          )}
          <div className="chat-bubble-user">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
          </div>
          {showActions && (
            <div className="flex justify-end gap-2 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {onBacktrack && (
                <button onClick={onBacktrack} className="text-[11px] text-wechat-text-light/60 hover:text-wechat-green transition-colors duration-150">
                  回溯
                </button>
              )}
              {onDelete && (
                <button onClick={onDelete} className="text-[11px] text-wechat-text-light/60 hover:text-wechat-danger transition-colors duration-150 flex items-center gap-0.5">
                  <Trash2 size={10} /> 删除
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── AI / Assistant message ──
  const parsed = message.parsed;
  const hasThinking = parsed?.thinking && parsed.thinking.trim();
  const chats = parsed?.chats && parsed.chats.length > 0 ? parsed.chats : null;

  return (
    <div
      className={`flex justify-start items-start gap-2.5 mb-0 message-enter px-4 ${isConsecutive ? 'message-consecutive' : 'mt-3'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar column */}
      <div className="flex-shrink-0" style={{ width: 34, height: 34 }}>
        {showAvatar && (
          <Avatar
            size="sm"
            name={avatarName || 'AI'}
            gradient={avatarGradient || 'linear-gradient(135deg, #667eea, #764ba2)'}
            src={avatarSrc}
          />
        )}
      </div>

      <div className="max-w-[60%] group min-w-0">
        {/* Time + name label */}
        {showAvatar && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[12px] font-medium text-wechat-text-secondary">{avatarName || 'AI'}</span>
            <span className="text-[10px] text-wechat-text-light/70 font-medium tracking-wide">{timeStr}</span>
          </div>
        )}

        {/* Thinking fold */}
        {hasThinking && showAvatar && (
          <div className="mb-1.5">
            <button
              onClick={() => setThinkingOpen(!thinkingOpen)}
              className="flex items-center gap-1.5 text-[11px] text-wechat-text-light/60 hover:text-wechat-green transition-colors duration-150 px-1"
            >
              <Brain size={11} className="flex-shrink-0" />
              <span>思考过程</span>
              {thinkingOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </button>
            {thinkingOpen && (
              <div className="mt-1.5 p-3 bg-white/60 backdrop-blur-sm rounded-lg text-[12px] text-wechat-text-gray leading-relaxed border-l-2 border-wechat-green shadow-sm animate-fadeIn">
                {parsed!.thinking}
              </div>
            )}
          </div>
        )}

        {/* Chat entries — each with type-specific premium UI */}
        <div className="space-y-1.5">
          {chats ? (
            chats.map((chat, i) => (
              <ChatEntryBubble key={i} entry={chat} />
            ))
          ) : (
            <div className="chat-bubble-other">
              <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{message.content}</p>
            </div>
          )}
        </div>

        {/* Consecutive time display */}
        {!showAvatar && isConsecutive && (
          <span className="text-[10px] text-wechat-text-light/50 mt-0.5 inline-block ml-1">{timeStr}</span>
        )}

        {/* Hover actions */}
        {showActions && onDelete && (
          <div className="flex gap-2 mt-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={onDelete}
              className="text-[11px] text-wechat-text-light/60 hover:text-wechat-danger transition-colors duration-150 flex items-center gap-0.5"
            >
              <Trash2 size={10} /> 删除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Individual Chat Entry Bubble ──

function ChatEntryBubble({ entry }: { entry: ChatEntry }) {
  switch (entry.type) {
    case 'voice':
      return <VoiceBubble entry={entry} />;
    case 'video':
      return <VideoBubble entry={entry} />;
    case 'image':
      return <ImageBubble entry={entry} />;
    case 'transfer':
      return <TransferBubble entry={entry} />;
    case 'document':
      return <DocumentBubble entry={entry} />;
    case 'location':
      return <LocationBubble entry={entry} />;
    case 'text':
    default:
      return <TextBubble entry={entry} />;
  }
}

// ── Text Bubble ──
function TextBubble({ entry }: { entry: ChatEntry }) {
  return (
    <div className="chat-bubble-other group/bubble hover-lift">
      <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{entry.content}</p>
    </div>
  );
}

// ── Voice Bubble ──
function VoiceBubble({ entry }: { entry: ChatEntry }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div
      className="chat-bubble-other cursor-pointer hover-lift transition-all duration-200"
      onClick={() => setPlaying(!playing)}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          playing ? 'bg-wechat-green text-white shadow-lg shadow-wechat-green/30 scale-105' : 'bg-gray-100 text-wechat-text-gray'
        }`}>
          {playing ? (
            <Music size={14} className="animate-pulse" />
          ) : (
            <Mic size={14} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] leading-relaxed line-clamp-2">{entry.content || '语音消息'}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Animated waveform bars */}
          <div className="flex items-end gap-[2px] h-5">
            {[3, 2, 4, 1.5, 3.5, 2.5].map((h, i) => (
              <span
                key={i}
                className={`w-[2.5px] rounded-full transition-all duration-300 ${
                  playing ? 'bg-wechat-green' : 'bg-wechat-text-light/40'
                }`}
                style={{
                  height: playing ? `${h * 5}px` : `${h * 2.5}px`,
                  animationDelay: `${i * 0.15}s`,
                  animation: playing ? `waveform 0.6s ease-in-out ${i * 0.1}s infinite alternate` : 'none',
                }}
              />
            ))}
          </div>
          {entry.duration && (
            <span className="text-[11px] text-wechat-text-light font-medium tabular-nums">{entry.duration}"</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Video Bubble ──
function VideoBubble({ entry }: { entry: ChatEntry }) {
  return (
    <div className="chat-bubble-other overflow-hidden">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
          <Video size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] leading-relaxed font-medium">视频通话</p>
          <p className="text-[12px] text-wechat-text-gray line-clamp-1 mt-0.5">{entry.content}</p>
        </div>
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="w-7 h-7 rounded-full border-2 border-wechat-green flex items-center justify-center">
            <Play size={10} className="text-wechat-green ml-0.5" fill="#07C160" />
          </div>
          {entry.duration && (
            <span className="text-[10px] text-wechat-text-light mt-0.5 tabular-nums">{formatDuration(entry.duration)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Image Bubble ──
function ImageBubble({ entry }: { entry: ChatEntry }) {
  return (
    <div className="chat-bubble-other overflow-hidden">
      <div className="flex items-center gap-3">
        <div className="w-[52px] h-[52px] rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0 border border-gray-200/50 overflow-hidden">
          <ImageIcon size={20} className="text-wechat-text-light/50" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <ImageIcon size={12} className="text-wechat-text-light/60 flex-shrink-0" />
            <span className="text-[12px] text-wechat-text-light font-medium">图片</span>
          </div>
          <p className="text-[14px] leading-relaxed mt-0.5 line-clamp-2">{entry.content || '[图片]'}</p>
        </div>
      </div>
    </div>
  );
}

// ── Transfer Bubble (Red Packet / Money) ──
function TransferBubble({ entry }: { entry: ChatEntry }) {
  return (
    <div className="relative overflow-hidden rounded-lg"
      style={{
        background: 'linear-gradient(135deg, #FA9D3B 0%, #F56C2D 40%, #E0481B 100%)',
        boxShadow: '0 2px 12px rgba(245, 108, 45, 0.25)',
      }}
    >
      <div className="px-4 py-3 flex items-center gap-3 relative z-10">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/30">
          <DollarSign size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-white/70 font-medium tracking-wide uppercase">转账</p>
          {entry.amount !== undefined && (
            <p className="text-[22px] font-bold text-white tracking-tight leading-tight tabular-nums">
              ¥{entry.amount.toFixed(2)}
            </p>
          )}
          {entry.transferNote && (
            <p className="text-[12px] text-white/80 mt-0.5 truncate">{entry.transferNote}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          <div className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <ChevronRight size={14} className="text-white/80" />
          </div>
        </div>
      </div>
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 2px, transparent 2px, transparent 8px)' }}
      />
    </div>
  );
}

// ── Document Bubble ──
function DocumentBubble({ entry }: { entry: ChatEntry }) {
  return (
    <div className="chat-bubble-other">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-wechat-text-secondary/10 to-wechat-text-secondary/5 flex items-center justify-center flex-shrink-0 border border-wechat-text-secondary/15">
          <FileText size={18} className="text-wechat-text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium leading-snug truncate">
            {entry.fileName || '未命名文件'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {entry.fileSize && (
              <span className="text-[11px] text-wechat-text-light font-medium tabular-nums">{entry.fileSize}</span>
            )}
            <span className="text-[11px] text-wechat-text-light/60 flex items-center gap-1">
              <Download size={10} /> 点击下载
            </span>
          </div>
          {entry.content && entry.content !== entry.fileName && (
            <p className="text-[12px] text-wechat-text-gray mt-0.5 line-clamp-1">{entry.content}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Location Bubble ──
function LocationBubble({ entry }: { entry: ChatEntry }) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-white border border-gray-100 hover-lift cursor-pointer transition-all duration-200"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      {/* Map header */}
      <div className="h-[80px] relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 30%, #A5D6A7 60%, #81C784 100%)',
        }}
      >
        {/* Grid lines like a map */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `
              linear-gradient(90deg, #000 1px, transparent 1px),
              linear-gradient(0deg, #000 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
        {/* Map pin */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <MapPin size={24} className="text-wechat-danger drop-shadow-md" fill="#FA5151" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-wechat-danger/20 animate-ping" />
          </div>
        </div>
      </div>
      {/* Address text */}
      <div className="px-3.5 py-2.5">
        <div className="flex items-center gap-1.5">
          <Navigation size={10} className="text-wechat-text-light/60 flex-shrink-0" />
          <span className="text-[11px] text-wechat-text-light font-medium">位置</span>
        </div>
        <p className="text-[14px] font-medium mt-0.5 leading-snug">
          {entry.address || entry.content || '共享位置'}
        </p>
      </div>
    </div>
  );
}

// ── Helpers ──

function formatMessageTime(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const hours = date.getHours().toString().padStart(2, '0');
  const mins = date.getMinutes().toString().padStart(2, '0');

  if (isToday) return `${hours}:${mins}`;

  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${mins}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}秒`;
}
