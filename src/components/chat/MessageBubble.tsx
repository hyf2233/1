import { useState } from 'react';
import type { ChatMessage } from '../../types';
import { ChevronDown, ChevronRight, Brain, Phone, Mic, Image, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import Avatar from '../shared/Avatar';

interface Props {
  message: ChatMessage;
  avatarSrc?: string;
  avatarName?: string;
  avatarGradient?: string;
  /** Whether to show the avatar (only first message in consecutive sequence) */
  showAvatar?: boolean;
  /** Whether this is a consecutive message from the same sender */
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

  // ===== USER MESSAGE (right side, no avatar in WeChat style) =====
  if (isUser) {
    return (
      <div
        className={`flex justify-end items-start mb-0 message-animate px-4 ${isConsecutive ? 'message-consecutive' : 'mt-3'}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="max-w-[65%]">
          <div className="chat-bubble-user relative group">
            <p className="whitespace-pre-wrap text-body">{message.content}</p>
          </div>
          {showActions && (
            <div className="flex justify-end gap-1 mt-0.5">
              {onBacktrack && (
                <button
                  onClick={onBacktrack}
                  className="text-small text-wechat-text-light hover:text-wechat-green transition-colors"
                >
                  ↩ 回溯
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="text-small text-wechat-text-light hover:text-wechat-danger transition-colors flex items-center gap-0.5"
                >
                  <Trash2 size={10} /> 删除
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== AI / Assistant message (left side, with avatar) =====
  const parsed = message.parsed;
  const hasThinking = parsed?.thinking && parsed.thinking.trim();
  const chats = parsed?.chats && parsed.chats.length > 0 ? parsed.chats : null;

  return (
    <div
      className={`flex justify-start items-start gap-2 mb-0 message-animate px-4 ${isConsecutive ? 'message-consecutive' : 'mt-3'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* AI Avatar — only shown on first message in sequence */}
      <div className="flex-shrink-0" style={{ width: 32, height: 32 }}>
        {showAvatar && (
          <Avatar
            size="sm"
            name={avatarName || 'AI'}
            gradient={avatarGradient || 'linear-gradient(135deg, #667eea, #764ba2)'}
            src={avatarSrc}
          />
        )}
      </div>

      <div className="max-w-[65%]">
        {/* Thinking fold */}
        {hasThinking && showAvatar && (
          <div className="mb-1">
            <button
              id={`thinking-toggle-${message.id}`}
              onClick={() => setThinkingOpen(!thinkingOpen)}
              className="flex items-center gap-1 text-small text-wechat-text-gray hover:text-wechat-green transition-colors"
            >
              <Brain size={11} />
              <span>思考过程</span>
              {thinkingOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </button>
            {thinkingOpen && (
              <div className="mt-1 p-2 bg-gray-50 rounded text-small text-wechat-text-gray leading-relaxed border-l-2 border-wechat-green">
                {parsed!.thinking}
              </div>
            )}
          </div>
        )}

        {/* Chat messages — each as a WeChat bubble */}
        <div className="space-y-1">
          {chats ? (
            chats.map((chat, i) => (
              <ChatBubble key={i} chat={chat} />
            ))
          ) : (
            <div className="chat-bubble-other">
              <p className="whitespace-pre-wrap leading-relaxed text-body">{message.content}</p>
            </div>
          )}
        </div>

        {/* Actions on hover */}
        {showActions && onDelete && (
          <div className="flex gap-1 mt-0.5">
            <button
              onClick={onDelete}
              className="text-small text-wechat-text-light hover:text-wechat-danger transition-colors flex items-center gap-0.5"
            >
              <Trash2 size={10} /> 删除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Render a single chat entry as a WeChat bubble */
function ChatBubble({ chat }: { chat: { type: string; content: string; duration?: number } }) {
  switch (chat.type) {
    case 'voice':
      return (
        <div className="chat-bubble-other flex items-center gap-2">
          <Mic size={14} className="text-wechat-text-gray flex-shrink-0" />
          <span className="text-body flex-1">{chat.content || '语音消息'}</span>
          {chat.duration && <span className="text-small text-wechat-text-light">{chat.duration}"</span>}
        </div>
      );

    case 'video':
      return (
        <div className="chat-bubble-other flex items-center gap-2">
          <Phone size={14} className="text-wechat-green flex-shrink-0" />
          <div>
            <p className="text-body">{chat.content || '视频通话'}</p>
            {chat.duration && (
              <p className="text-small text-wechat-text-light mt-0.5">通话时长 {formatDuration(chat.duration)}</p>
            )}
          </div>
        </div>
      );

    case 'image':
      return (
        <div className="chat-bubble-other flex items-center gap-2">
          <Image size={14} className="text-wechat-text-gray flex-shrink-0" />
          <span className="text-body">{chat.content || '[图片]'}</span>
        </div>
      );

    case 'text':
    default:
      return (
        <div className="chat-bubble-other">
          <p className="whitespace-pre-wrap leading-relaxed text-body">{chat.content}</p>
        </div>
      );
  }
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}秒`;
}
