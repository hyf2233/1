import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/appStore';
import Avatar from '../shared/Avatar';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import HistoryDrawer from './HistoryDrawer';
import { MoreHorizontal, Clock } from 'lucide-react';

/** Strip XML tags for clean streaming chat display */
function stripXmlTags(text: string): string {
  return text.replace(/<(sum|vars|thinking|think|chat)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

export default function ChatDetail() {
  const activeChat = useAppStore(s => s.activeChat);
  const contacts = useAppStore(s => s.contacts);
  const isStreaming = useAppStore(s => s.isStreaming);
  const streamedText = useAppStore(s => s.streamedText);
  const toggleHistoryDrawer = useAppStore(s => s.toggleHistoryDrawer);
  const backtrackTo = useAppStore(s => s.backtrackTo);
  const chat = activeChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contact = chat ? contacts.find(c => c.id === chat.contactId) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages, streamedText]);

  if (!chat || !contact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-wechat-bg">
        <p className="text-wechat-text-gray text-body">选择一位联系人开始对话</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-wechat-divider px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar gradient={contact.avatar} name={contact.name} size="md" online={contact.online} />
          <div>
            <h2 className="text-subtitle font-semibold">{contact.name}</h2>
            <p className="text-small text-wechat-text-light">
              {contact.online ? '在线' : '离线'}
              {contact.bio && ` · ${contact.bio.slice(0, 15)}...`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            id="history-drawer-btn"
            onClick={toggleHistoryDrawer}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="消息历史"
          >
            <Clock size={18} className="text-wechat-text-gray" />
          </button>
          <button id="chat-menu-btn" className="p-2 hover:bg-gray-100 rounded-md transition-colors" title="更多">
            <MoreHorizontal size={18} className="text-wechat-text-gray" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col" id="chat-messages-container">
        {chat.messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onBacktrack={msg.role === 'user' ? () => backtrackTo(msg.id) : undefined}
          />
        ))}

        {/* Streaming text */}
        {isStreaming && streamedText && (
          <div className="flex justify-start mb-3">
            <div className="chat-bubble-other max-w-[80%]">
              <p className="whitespace-pre-wrap leading-relaxed">
                {stripXmlTags(streamedText)}
                <span className="inline-block w-[2px] h-[1.1em] bg-wechat-green ml-0.5 align-middle animate-pulse" />
              </p>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {isStreaming && !streamedText && (
          <div className="flex justify-start mb-3">
            <div className="chat-bubble-other px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-wechat-text-light animate-typing" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-wechat-text-light animate-typing" style={{ animationDelay: '200ms' }} />
                <span className="w-2 h-2 rounded-full bg-wechat-text-light animate-typing" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput />
      <HistoryDrawer />
    </div>
  );
}
