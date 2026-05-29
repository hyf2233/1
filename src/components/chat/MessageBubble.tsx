import { useState } from 'react';
import type { ChatMessage } from '../../types';
import { ChevronDown, ChevronRight, Brain, Phone, Mic, Image, FileText } from 'lucide-react';

interface Props {
  message: ChatMessage;
  onBacktrack?: () => void;
}

export default function MessageBubble({ message, onBacktrack }: Props) {
  const isUser = message.role === 'user';
  const [thinkingOpen, setThinkingOpen] = useState(false);

  if (isUser) {
    return (
      <div className="flex justify-end mb-3 message-animate">
        <div className="max-w-[65%]">
          <div className="chat-bubble-user group relative">
            <p className="whitespace-pre-wrap">{message.content}</p>
            {onBacktrack && (
              <button
                onClick={onBacktrack}
                className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                title="回溯到此消息"
                id={`backtrack-${message.id}`}
              >
                <span className="text-wechat-text-light text-small">↩</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Assistant — render chat-style messages
  const parsed = message.parsed;
  const hasThinking = parsed?.thinking && parsed.thinking.trim();
  const chats = parsed?.chats && parsed.chats.length > 0 ? parsed.chats : null;
  const hasSum = parsed?.sum && parsed.sum.trim();

  return (
    <div className="flex justify-start mb-3 message-animate">
      <div className="max-w-[80%]">
        <div className="space-y-1.5">
          {/* Thinking fold */}
          {hasThinking && (
            <div className="mb-1">
              <button
                id={`thinking-toggle-${message.id}`}
                onClick={() => setThinkingOpen(!thinkingOpen)}
                className="flex items-center gap-1.5 text-small text-wechat-text-gray hover:text-wechat-green transition-colors"
              >
                <Brain size={12} />
                <span className="font-medium">思考过程</span>
                {thinkingOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
              {thinkingOpen && (
                <div className="mt-1.5 p-2.5 bg-gray-50 rounded-md text-small text-wechat-text-gray leading-relaxed border-l-2 border-wechat-green">
                  {parsed!.thinking}
                </div>
              )}
            </div>
          )}

          {/* Chat messages — rendered as WeChat-style bubbles */}
          {chats ? (
            chats.map((chat, i) => (
              <ChatBubble key={i} chat={chat} />
            ))
          ) : (
            <div className="chat-bubble-other">
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
            </div>
          )}

          {/* Summary line */}
          {hasSum && (
            <div className="flex items-start gap-1.5 pt-1">
              <FileText size={11} className="text-wechat-text-light mt-0.5 flex-shrink-0" />
              <p className="text-small text-wechat-text-light">{parsed!.sum}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Render a single chat entry as a WeChat-style message */
function ChatBubble({ chat }: { chat: { type: string; content: string; duration?: number } }) {
  switch (chat.type) {
    case 'voice':
      return (
        <div className="chat-bubble-other flex items-center gap-2">
          <Mic size={14} className="text-wechat-text-gray flex-shrink-0" />
          <span className="text-body">{chat.content || '语音消息'}</span>
          {chat.duration && (
            <span className="text-small text-wechat-text-light flex-shrink-0">{chat.duration}"</span>
          )}
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
          <p className="whitespace-pre-wrap leading-relaxed">{chat.content}</p>
        </div>
      );
  }
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}秒`;
}
