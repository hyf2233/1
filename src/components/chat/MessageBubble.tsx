import { useState } from 'react';
import type { ChatMessage } from '../../types';
import { useAppStore } from '../../store/appStore';
import { ChevronDown, ChevronRight, Brain, FileText, Hash } from 'lucide-react';

interface Props {
  message: ChatMessage;
  onBacktrack?: () => void;
}

export default function MessageBubble({ message, onBacktrack }: Props) {
  const isUser = message.role === 'user';
  const sendMessage = useAppStore(s => s.sendMessage);
  const isStreaming = useAppStore(s => s.isStreaming);
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

  // Assistant message — render full SillyTavern XML tags
  const parsed = message.parsed;
  const hasThinking = parsed?.thinking && parsed.thinking.trim();
  const hasMaintext = parsed?.maintext && parsed.maintext.trim();
  const hasOptions = parsed?.options && parsed.options.length > 0;
  const hasSum = parsed?.sum && parsed.sum.trim();
  const displayContent = hasMaintext ? parsed!.maintext : message.content;

  const handleOptionClick = (option: string) => {
    if (!isStreaming) sendMessage(option);
  };

  return (
    <div className="flex justify-start mb-3 message-animate">
      <div className="max-w-[80%]">
        <div className="chat-bubble-other">
          {/* Thinking fold */}
          {hasThinking && (
            <div className="mb-2">
              <button
                id={`thinking-toggle-${message.id}`}
                onClick={() => setThinkingOpen(!thinkingOpen)}
                className="flex items-center gap-1.5 text-small text-wechat-text-gray hover:text-wechat-green transition-colors w-full text-left"
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

          {/* Main text */}
          <p className="whitespace-pre-wrap leading-relaxed">{displayContent}</p>

          {/* Summary */}
          {hasSum && (
            <div className="mt-2.5 pt-2.5 border-t border-wechat-divider flex items-start gap-1.5">
              <FileText size={11} className="text-wechat-text-light mt-0.5 flex-shrink-0" />
              <p className="text-small text-wechat-text-light">{parsed!.sum}</p>
            </div>
          )}
        </div>

        {/* Option buttons */}
        {hasOptions && (
          <div className="flex flex-col gap-1.5 mt-2">
            {parsed!.options.map((opt, i) => (
              <button
                key={i}
                id={`msg-option-${message.id}-${i}`}
                onClick={() => handleOptionClick(opt)}
                disabled={isStreaming}
                className="option-btn group relative"
              >
                <span>{opt}</span>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-wechat-green text-small">
                  ↵
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Variable changes */}
        {parsed?.varsCommands?.merge && Object.keys(parsed.varsCommands.merge).length > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5 text-small text-wechat-text-light">
            <Hash size={10} />
            <span>
              {Object.entries(parsed.varsCommands.merge)
                .filter(([, v]) => v !== undefined && v !== null)
                .map(([k, v]) => `${k}: ${typeof v === 'number' ? (v > 0 ? '+' : '') + v : v}`)
                .join(' · ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
