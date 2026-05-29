import type { ChatMessage } from '../../types';

interface Props {
  message: ChatMessage;
  onBacktrack?: () => void;
}

export default function MessageBubble({ message, onBacktrack }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 message-animate`}>
      <div className={isUser ? 'max-w-[65%]' : 'max-w-[80%]'}>
        {isUser ? (
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
        ) : (
          <div>
            {message.parsed ? (
              <div className="chat-bubble-other">
                <p className="whitespace-pre-wrap leading-relaxed">{message.parsed.maintext}</p>
              </div>
            ) : (
              <div className="chat-bubble-other">
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
