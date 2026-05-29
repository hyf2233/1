import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Smile, Plus } from 'lucide-react';

export default function ChatInput() {
  const [input, setInput] = useState('');
  const sendMessage = useAppStore(s => s.sendMessage);
  const isStreaming = useAppStore(s => s.isStreaming);
  const currentOptions = useAppStore(s => s.currentOptions);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
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
        <button id="emoji-btn" className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0">
          <Smile size={22} className="text-wechat-text-gray" />
        </button>
        <div className="flex-1 bg-wechat-bg rounded-md px-3 py-2">
          <textarea
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
        <button id="more-btn" className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0">
          <Plus size={22} className="text-wechat-text-gray" />
        </button>
      </div>
    </div>
  );
}
