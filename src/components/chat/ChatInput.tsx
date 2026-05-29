import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { Smile, Send, Loader2 } from 'lucide-react';

export default function ChatInput() {
  const [input, setInput] = useState('');
  const sendMessage = useAppStore(s => s.sendMessage);
  const isStreaming = useAppStore(s => s.isStreaming);
  const currentOptions = useAppStore(s => s.currentOptions);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasText = input.trim().length > 0;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [input]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-wechat-divider bg-white px-4 py-3">
      {/* Current options from last AI response */}
      {currentOptions.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {currentOptions.map((opt, i) => (
            <button
              key={i}
              id={`option-${i}`}
              onClick={() => { sendMessage(opt); }}
              className="option-btn text-left"
              disabled={isStreaming}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3">
        <button
          id="emoji-btn"
          className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
          disabled={isStreaming}
        >
          <Smile size={22} className="text-wechat-text-gray" />
        </button>

        <div className="flex-1 bg-wechat-bg rounded-md px-3 py-2">
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            rows={1}
            className="w-full bg-transparent outline-none text-body resize-none placeholder:text-wechat-text-light"
            disabled={isStreaming}
          />
        </div>

        {/* Send button — replaces static + button */}
        {isStreaming ? (
          <button
            id="sending-indicator"
            className="p-1.5 flex-shrink-0 cursor-not-allowed"
            disabled
          >
            <Loader2 size={22} className="text-wechat-green animate-spin" />
          </button>
        ) : hasText ? (
          <button
            id="send-btn"
            onClick={handleSend}
            className="p-1.5 rounded-md bg-wechat-green hover:bg-wechat-green-dark transition-all duration-150 flex-shrink-0 active:scale-90"
            title="发送"
          >
            <Send size={18} className="text-white" />
          </button>
        ) : (
          <button
            id="more-btn"
            className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
          >
            <Send size={18} className="text-wechat-text-gray rotate-90" />
          </button>
        )}
      </div>
    </div>
  );
}
