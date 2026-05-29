import { useState, useMemo } from 'react';
import type { ChatMessage, ChatEntry } from '../../types';
import {
  ChevronDown, ChevronRight, Brain, Trash2,
  Mic, Video, ImageIcon,
  DollarSign, FileText, MapPin,
  Music, Download, Navigation,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { parseChatEntriesFromXml } from '../../sillytavern/editor-utils';
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

  // Resolve chat entries: prefer parsed.chats, fall back to parsing content as XML, then plain text
  const resolvedChats: ChatEntry[] | null = useMemo(() => {
    if (message.parsed?.chats && message.parsed.chats.length > 0) {
      return message.parsed.chats;
    }
    // Try parsing content as XML (for messages from lorebook or manual entries)
    const parsed = parseChatEntriesFromXml(message.content);
    if (parsed.length > 0) return parsed;
    return null;
  }, [message.content, message.parsed?.chats]);

  const parsed = message.parsed;

  // ── USER MESSAGE (right side) ──
  if (isUser) {
    const hasTypedContent = resolvedChats !== null && resolvedChats.length > 0;

    return (
      <div
        className={`flex justify-end items-start mb-0 message-enter px-4 ${isConsecutive ? 'message-consecutive' : 'mt-3'}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="max-w-[60%] group">
          {!isConsecutive && !hasTypedContent && (
            <div className="flex justify-end mb-1">
              <span className="text-[10px] text-wechat-text-light/70 font-medium tracking-wide">{timeStr}</span>
            </div>
          )}
          {hasTypedContent ? (
            /* Typed user message — use type-specific bubble styles on the right */
            <div className="space-y-1.5">
              {resolvedChats!.map((chat, i) => (
                <UserChatEntryBubble key={i} entry={chat} />
              ))}
            </div>
          ) : (
            /* Plain text user message */
            <div className="chat-bubble-user">
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
            </div>
          )}
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
  const hasThinking = parsed?.thinking && parsed.thinking.trim();

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

        {/* Chat entries */}
        <div className="space-y-1.5">
          {resolvedChats ? (
            resolvedChats.map((chat, i) => (
              <ChatEntryBubble key={i} entry={chat} isConsecutive={isConsecutive && i > 0} />
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

// ═══════════════════════════════════════
// Chat Entry Bubbles — All 7 Types
// ═══════════════════════════════════════

export function ChatEntryBubble({ entry, isConsecutive = false }: { entry: ChatEntry; isConsecutive?: boolean }) {
  const shared = { entry, isConsecutive };
  switch (entry.type) {
    case 'voice':
      return <VoiceBubble {...shared} />;
    case 'video':
      return <VideoBubble {...shared} />;
    case 'image':
      return <ImageBubble {...shared} />;
    case 'transfer':
      return <TransferBubble {...shared} />;
    case 'document':
      return <DocumentBubble {...shared} />;
    case 'location':
      return <LocationBubble {...shared} />;
    case 'text':
    default:
      return <TextBubble {...shared} />;
  }
}

// ── User-side chat entry bubbles (right-aligned, green style) ──
export function UserChatEntryBubble({ entry }: { entry: ChatEntry }) {
  switch (entry.type) {
    case 'voice':
      return <UserVoiceBubble entry={entry} />;
    case 'video':
      return <UserVideoBubble entry={entry} />;
    case 'image':
      return <UserImageBubble entry={entry} />;
    case 'transfer':
      return <UserTransferBubble entry={entry} />;
    case 'document':
      return <UserDocumentBubble entry={entry} />;
    case 'location':
      return <UserLocationBubble entry={entry} />;
    default:
      return (
        <div className="chat-bubble-user">
          <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{entry.content}</p>
        </div>
      );
  }
}

// ── Text Bubble ──
function TextBubble({ entry, isConsecutive }: { entry: ChatEntry; isConsecutive: boolean }) {
  return (
    <div className="chat-bubble-other group/bubble hover-lift">
      <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{entry.content}</p>
      {entry.time && (
        <span className="text-[10px] text-wechat-text-light/50 float-right mt-1 ml-2">{entry.time}</span>
      )}
    </div>
  );
}

// ── Voice Bubble ──
function VoiceBubble({ entry, isConsecutive }: { entry: ChatEntry; isConsecutive: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(false);

  const handlePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    setPlaying(true);
    setPlayed(true);
    // Auto-stop after duration
    if (entry.duration) {
      setTimeout(() => setPlaying(false), entry.duration * 1000);
    }
  };

  return (
    <div
      className="chat-bubble-other cursor-pointer hover-lift transition-all duration-200"
      onClick={handlePlay}
    >
      <div className="flex items-center gap-3">
        {/* Left: play/stop button */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          playing ? 'bg-wechat-green text-white shadow-lg shadow-wechat-green/30 scale-105' : 'bg-gray-100 text-wechat-text-gray'
        }`}>
          {playing ? (
            <Music size={14} className="animate-pulse" />
          ) : (
            <Mic size={14} />
          )}
        </div>

        {/* Center: text + time */}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] leading-relaxed line-clamp-2">{entry.content || '语音消息'}</p>
          {entry.time && (
            <span className="text-[10px] text-wechat-text-light/50 mt-0.5 inline-block">{entry.time}</span>
          )}
        </div>

        {/* Right: waveform + duration + red dot */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Red dot for unplayed */}
          {!played && (
            <span className="w-2 h-2 rounded-full bg-wechat-danger animate-pulse flex-shrink-0" />
          )}
          {/* Waveform */}
          <div className="flex items-end gap-[2px] h-5">
            {[3, 2, 4, 1.5, 3.5, 2.5].map((h, i) => (
              <span
                key={i}
                className={`w-[2.5px] rounded-full transition-all duration-300 ${
                  playing ? 'bg-wechat-green' : played ? 'bg-wechat-text-light/30' : 'bg-wechat-text-light/40'
                }`}
                style={{
                  height: playing ? `${h * 5}px` : `${h * 2.5}px`,
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
function VideoBubble({ entry, isConsecutive }: { entry: ChatEntry; isConsecutive: boolean }) {
  return (
    <div className="chat-bubble-other overflow-hidden hover-lift transition-all duration-200">
      <div className="flex items-center gap-3">
        {/* Left: green phone icon */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-wechat-green to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-wechat-green/20">
          <Video size={14} className="text-white" />
        </div>

        {/* Center: label + content + time */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-wechat-green">
              {entry.duration ? '视频通话' : '视频通话'}
            </span>
          </div>
          <p className="text-[12px] text-wechat-text-gray line-clamp-1 mt-0.5">{entry.content || '点击回拨'}</p>
          {entry.time && (
            <span className="text-[10px] text-wechat-text-light/50 mt-0.5 inline-block">{entry.time}</span>
          )}
        </div>

        {/* Right: call info + duration */}
        <div className="flex flex-col items-center flex-shrink-0 gap-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
            entry.duration ? 'border-2 border-wechat-green' : 'border-2 border-wechat-danger/40'
          }`}>
            {entry.duration ? (
              <Video size={12} className="text-wechat-green" />
            ) : (
              <Video size={12} className="text-wechat-danger/50" />
            )}
          </div>
          {entry.duration ? (
            <span className="text-[10px] text-wechat-text-light tabular-nums">{formatDuration(entry.duration)}</span>
          ) : (
            <span className="text-[10px] text-wechat-danger/60">未接听</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Image Bubble ──
function ImageBubble({ entry, isConsecutive }: { entry: ChatEntry; isConsecutive: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="chat-bubble-other overflow-hidden hover-lift transition-all duration-200">
      {/* Thumbnail */}
      <div
        className="w-full h-[120px] rounded-md mb-2 relative overflow-hidden flex items-center justify-center cursor-pointer group/img"
        style={{
          background: loaded && !error
            ? 'transparent'
            : 'linear-gradient(135deg, #e8e8e8 0%, #d5d5d5 50%, #e0e0e0 100%)',
        }}
      >
        {/* Placeholder gradient */}
        {(!loaded || error) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <ImageIcon size={28} className="text-wechat-text-light/30" />
            <span className="text-[11px] text-wechat-text-light/40 font-medium">图片</span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/5 transition-colors duration-200 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-200">
            <ImageIcon size={16} className="text-wechat-text-gray" />
          </div>
        </div>
      </div>

      {/* Description + time */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[14px] leading-relaxed flex-1">{entry.content || '[图片]'}</p>
        {entry.time && (
          <span className="text-[10px] text-wechat-text-light/50 flex-shrink-0 mt-0.5">{entry.time}</span>
        )}
      </div>
    </div>
  );
}

// ── Transfer Bubble (Red Packet / Money) ──
function TransferBubble({ entry, isConsecutive }: { entry: ChatEntry; isConsecutive: boolean }) {
  const [opened, setOpened] = useState(false);

  return (
    <div
      className="relative overflow-hidden rounded-lg cursor-pointer hover-lift transition-all duration-200"
      onClick={() => setOpened(!opened)}
      style={{
        background: opened
          ? 'linear-gradient(135deg, #FA9D3B 0%, #F56C2D 40%, #E0481B 100%)'
          : 'linear-gradient(135deg, #FA9D3B 0%, #F56C2D 40%, #E0481B 100%)',
        boxShadow: opened
          ? '0 4px 16px rgba(245, 108, 45, 0.35)'
          : '0 2px 12px rgba(245, 108, 45, 0.25)',
      }}
    >
      <div className="px-4 py-3 flex items-center gap-3 relative z-10">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/30">
          <DollarSign size={16} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          {opened ? (
            /* Opened state */
            <>
              <p className="text-[11px] text-white/60 font-medium tracking-wide uppercase">已收款</p>
              {entry.amount !== undefined && (
                <p className="text-[22px] font-bold text-white tracking-tight leading-tight tabular-nums">
                  ¥{entry.amount.toFixed(2)}
                </p>
              )}
              {entry.transferNote && (
                <p className="text-[12px] text-white/80 mt-0.5 truncate">{entry.transferNote}</p>
              )}
            </>
          ) : (
            /* Closed state — resembles WeChat red packet */
            <>
              <p className="text-[13px] text-white font-semibold">微信转账</p>
              {entry.amount !== undefined && (
                <p className="text-[18px] font-bold text-white tracking-tight leading-tight tabular-nums mt-0.5">
                  ¥{entry.amount.toFixed(2)}
                </p>
              )}
              {entry.transferNote && (
                <p className="text-[11px] text-white/70 mt-0.5 truncate">{entry.transferNote}</p>
              )}
            </>
          )}
          {/* Time */}
          {entry.time && (
            <p className="text-[10px] text-white/50 mt-1">{entry.time}</p>
          )}
        </div>

        <div className="flex-shrink-0">
          <div className={`w-7 h-7 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 transition-transform duration-300 ${opened ? 'rotate-90' : ''}`}>
            <ChevronRight size={14} className="text-white/80" />
          </div>
        </div>
      </div>

      {/* Content after opening */}
      {opened && entry.content && entry.content !== entry.transferNote && (
        <div className="px-4 pb-3 pt-0 relative z-10">
          <p className="text-[12px] text-white/80 border-t border-white/15 pt-2">{entry.content}</p>
        </div>
      )}

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 2px, transparent 2px, transparent 8px)' }}
      />
    </div>
  );
}

// ── Document Bubble ──
function DocumentBubble({ entry, isConsecutive }: { entry: ChatEntry; isConsecutive: boolean }) {
  const fileExt = useMemo(() => {
    const name = entry.fileName || '';
    const dot = name.lastIndexOf('.');
    return dot > 0 ? name.slice(dot + 1).toUpperCase() : 'FILE';
  }, [entry.fileName]);

  const fileColor = useMemo(() => {
    const colors: Record<string, string> = {
      PDF: '#F44336',
      DOC: '#2196F3',
      DOCX: '#2196F3',
      XLS: '#4CAF50',
      XLSX: '#4CAF50',
      PPT: '#FF9800',
      PPTX: '#FF9800',
      TXT: '#607D8B',
      ZIP: '#795548',
      RAR: '#795548',
      JPG: '#9C27B0',
      PNG: '#9C27B0',
      MP3: '#00BCD4',
      MP4: '#E91E63',
    };
    return colors[fileExt] || '#607D8B';
  }, [fileExt]);

  return (
    <div className="chat-bubble-other hover-lift transition-all duration-200">
      <div className="flex items-center gap-3">
        {/* File icon with type badge */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 relative"
          style={{
            background: `linear-gradient(135deg, ${fileColor}15, ${fileColor}08)`,
            border: `1.5px solid ${fileColor}25`,
          }}
        >
          <FileText size={18} style={{ color: fileColor }} />
          <span
            className="absolute -bottom-1 -right-1 text-[7px] font-bold px-1 py-0.5 rounded tracking-wider"
            style={{ background: fileColor, color: '#fff' }}
          >
            {fileExt}
          </span>
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium leading-snug truncate">
            {entry.fileName || '未命名文件'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {entry.fileSize && (
              <span className="text-[11px] text-wechat-text-light font-medium tabular-nums">{entry.fileSize}</span>
            )}
            {entry.fileSize && entry.time && (
              <span className="text-[10px] text-wechat-text-light/30">·</span>
            )}
            {entry.time && (
              <span className="text-[11px] text-wechat-text-light/50">{entry.time}</span>
            )}
            <span className="text-[10px] text-wechat-text-light/40 flex items-center gap-0.5 ml-auto">
              <Download size={9} /> 下载
            </span>
          </div>
          {entry.content && entry.content !== entry.fileName && (
            <p className="text-[12px] text-wechat-text-gray mt-1 line-clamp-1">{entry.content}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Location Bubble ──
function LocationBubble({ entry, isConsecutive }: { entry: ChatEntry; isConsecutive: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-white border border-gray-100 hover-lift cursor-pointer transition-all duration-200"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      {/* Map preview header */}
      <div className="h-[80px] relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 30%, #A5D6A7 60%, #81C784 100%)',
        }}
      >
        {/* Grid lines (map-like) */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `
              linear-gradient(90deg, #000 1px, transparent 1px),
              linear-gradient(0deg, #000 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
        {/* Animated map pin */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <MapPin size={24} className="text-wechat-danger drop-shadow-md" fill="#FA5151" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-wechat-danger/20 animate-ping" />
          </div>
        </div>
      </div>

      {/* Address info + time */}
      <div className="px-3.5 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Navigation size={10} className="text-wechat-text-light/60 flex-shrink-0" />
            <span className="text-[10px] text-wechat-text-light font-medium uppercase tracking-wider">位置</span>
          </div>
          {entry.time && (
            <span className="text-[10px] text-wechat-text-light/50">{entry.time}</span>
          )}
        </div>
        <p className="text-[14px] font-medium mt-1 leading-snug">
          {entry.address || entry.content || '共享位置'}
        </p>
        {entry.content && entry.address && entry.content !== entry.address && (
          <p className="text-[11px] text-wechat-text-light/60 mt-0.5">{entry.content}</p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// User-side Typed Bubbles (right-aligned, green style)
// ═══════════════════════════════════════

function UserVoiceBubble({ entry }: { entry: ChatEntry }) {
  return (
    <div className="chat-bubble-user">
      <div className="flex items-center gap-3">
        {/* Waveform */}
        <div className="flex items-end gap-[2px] h-5">
          {[3, 2, 4, 1.5, 3.5, 2.5].map((h, i) => (
            <span key={i} className="w-[2.5px] rounded-full bg-black/25"
              style={{ height: `${h * 2.5}px` }} />
          ))}
        </div>
        {entry.duration && (
          <span className="text-[11px] text-black/40 font-medium tabular-nums">{entry.duration}"</span>
        )}
        <p className="text-[14px] leading-relaxed line-clamp-2 flex-1">{entry.content || '语音消息'}</p>
        <Mic size={14} className="text-black/30 flex-shrink-0" />
      </div>
      {entry.time && <span className="text-[9px] text-black/25 float-right mt-0.5">{entry.time}</span>}
    </div>
  );
}

function UserVideoBubble({ entry }: { entry: ChatEntry }) {
  return (
    <div className="chat-bubble-user">
      <div className="flex items-center gap-3">
        <Video size={14} className="text-black/40 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-semibold">视频通话</span>
          <p className="text-[12px] line-clamp-1">{entry.content || '点击回拨'}</p>
        </div>
        {entry.duration ? (
          <span className="text-[10px] text-black/40 tabular-nums">{formatDuration(entry.duration)}</span>
        ) : (
          <span className="text-[10px] text-black/30">已取消</span>
        )}
      </div>
      {entry.time && <span className="text-[9px] text-black/25 float-right mt-0.5">{entry.time}</span>}
    </div>
  );
}

function UserImageBubble({ entry }: { entry: ChatEntry }) {
  return (
    <div className="chat-bubble-user">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <ImageIcon size={14} className="text-black/30 flex-shrink-0" />
          <p className="text-[14px] leading-relaxed">{entry.content || '[图片]'}</p>
        </div>
        {entry.time && <span className="text-[9px] text-black/25 flex-shrink-0 mt-0.5">{entry.time}</span>}
      </div>
    </div>
  );
}

function UserTransferBubble({ entry }: { entry: ChatEntry }) {
  return (
    <div className="chat-bubble-user"
      style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #F56C2D 50%, #E0481B 100%)' }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 border border-white/30">
          <DollarSign size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-white/80 font-medium">转账</p>
          {entry.amount !== undefined && (
            <p className="text-[18px] font-bold text-white tracking-tight leading-tight tabular-nums">
              ¥{entry.amount.toFixed(2)}
            </p>
          )}
          {entry.transferNote && (
            <p className="text-[11px] text-white/70 mt-0.5 truncate">{entry.transferNote}</p>
          )}
        </div>
        <ChevronRight size={14} className="text-white/60 flex-shrink-0" />
      </div>
      {entry.time && <span className="text-[9px] text-white/40 float-right mt-0.5">{entry.time}</span>}
    </div>
  );
}

function UserDocumentBubble({ entry }: { entry: ChatEntry }) {
  return (
    <div className="chat-bubble-user">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-black/10 flex items-center justify-center flex-shrink-0">
          <FileText size={16} className="text-black/40" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium truncate">{entry.fileName || '未命名文件'}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {entry.fileSize && <span className="text-[10px] text-black/30">{entry.fileSize}</span>}
            {entry.time && <span className="text-[10px] text-black/25">{entry.time}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserLocationBubble({ entry }: { entry: ChatEntry }) {
  return (
    <div className="chat-bubble-user">
      <div className="flex items-center gap-3">
        <MapPin size={16} className="text-wechat-danger flex-shrink-0" fill="#FA5151" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Navigation size={9} className="text-black/30 flex-shrink-0" />
            <span className="text-[10px] text-black/40">位置</span>
          </div>
          <p className="text-[14px] leading-snug mt-0.5">{entry.address || entry.content || '共享位置'}</p>
        </div>
        {entry.time && <span className="text-[9px] text-black/25 flex-shrink-0 self-end">{entry.time}</span>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════

function formatMessageTime(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const hours = date.getHours().toString().padStart(2, '0');
  const mins = date.getMinutes().toString().padStart(2, '0');

  if (isToday) return `${hours}:${mins}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${hours}:${mins}`;
  }

  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays < 7) {
    return `${days[date.getDay()]} ${hours}:${mins}`;
  }

  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${mins}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `00:${String(s).padStart(2, '0')}`;
}
