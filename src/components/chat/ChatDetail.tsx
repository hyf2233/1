import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/appStore';
import Avatar from '../shared/Avatar';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import HistoryDrawer from './HistoryDrawer';
import { MoreHorizontal, Clock } from 'lucide-react';

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
  const deleteMessage = useAppStore(s => s.deleteMessage);
  const chat = activeChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contact = chat ? contacts.find(c => c.id === chat.contactId) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages, streamedText]);

  const handleDelete = (messageId: string) => {
    if (chat) deleteMessage(chat.id, messageId);
  };

  if (!chat || !contact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-wechat-bg">
        <p className="text-wechat-text-gray text-body">选择一位联系人开始对话</p>
      </div>
    );
  }

  const aiAvatarSrc = contact.avatarType === 'image' ? contact.avatarImage : undefined;

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header — WeChat style */}
      <div className="bg-[#EDEDED] border-b border-wechat-divider px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar
            gradient={contact.avatar}
            name={contact.name}
            size="md"
            online={contact.online}
            src={aiAvatarSrc}
          />
          <div>
            <h2 className="text-[16px] font-semibold">{contact.name}</h2>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            id="history-drawer-btn"
            onClick={toggleHistoryDrawer}
            className="p-2 hover:bg-gray-200/50 rounded-md transition-colors"
            title="消息历史"
          >
            <Clock size={18} className="text-wechat-text-gray" />
          </button>
          <button id="chat-menu-btn" className="p-2 hover:bg-gray-200/50 rounded-md transition-colors" title="更多">
            <MoreHorizontal size={18} className="text-wechat-text-gray" />
          </button>
        </div>
      </div>

      {/* Messages area — WeChat style with #EDEDED background */}
      <div className="flex-1 overflow-y-auto py-2 flex flex-col bg-[#EDEDED]" id="chat-messages-container">
        {chat.messages.map((msg, idx, arr) => {
          const prevMsg = idx > 0 ? arr[idx - 1] : null;
          const isConsecutive = prevMsg?.role === msg.role;
          const showAvatar = msg.role === 'assistant' && !isConsecutive;
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              avatarSrc={aiAvatarSrc}
              avatarName={contact.name}
              avatarGradient={contact.avatar}
              showAvatar={showAvatar}
              isConsecutive={isConsecutive}
              onBacktrack={msg.role === 'user' ? () => backtrackTo(msg.id) : undefined}
              onDelete={() => handleDelete(msg.id)}
            />
          );
        })}

        {/* Streaming text */}
        {isStreaming && streamedText && (
          <div className="flex justify-start items-start gap-2 message-animate px-4 mt-3">
            <Avatar
              size="sm"
              name={contact.name}
              gradient={contact.avatar}
              src={aiAvatarSrc}
            />
            <div className="chat-bubble-other max-w-[65%]">
              <p className="whitespace-pre-wrap leading-relaxed text-body">
                {stripXmlTags(streamedText)}
                <span className="inline-block w-[2px] h-[1.1em] bg-wechat-green ml-0.5 align-middle animate-pulse" />
              </p>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {isStreaming && !streamedText && (
          <div className="flex justify-start items-start gap-2 px-4 mt-3">
            <Avatar size="sm" name={contact.name} gradient={contact.avatar} src={aiAvatarSrc} />
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
