import { useAppStore } from '../../store/appStore';
import Drawer from '../shared/Drawer';
import { GitBranch, Clock } from 'lucide-react';

export default function HistoryDrawer() {
  const showHistoryDrawer = useAppStore(s => s.showHistoryDrawer);
  const toggleHistoryDrawer = useAppStore(s => s.toggleHistoryDrawer);
  const activeChat = useAppStore(s => s.activeChat);
  const backtrackTo = useAppStore(s => s.backtrackTo);
  const chat = activeChat();

  if (!chat) return null;

  const handleBacktrack = (messageId: string) => {
    backtrackTo(messageId);
    toggleHistoryDrawer();
  };

  return (
    <Drawer open={showHistoryDrawer} onClose={toggleHistoryDrawer} title="消息历史" side="left" width="w-72">
      <div className="p-3">
        <p className="text-small text-wechat-text-gray mb-3">点击任意消息可回溯到该时刻，创建新的对话分支</p>
        {chat.messages.map((msg) => (
          <button
            key={msg.id}
            id={`history-msg-${msg.id}`}
            onClick={() => handleBacktrack(msg.id)}
            className="w-full flex items-start gap-3 p-3 rounded-md hover:bg-wechat-bg transition-colors text-left border-b border-wechat-divider last:border-0"
          >
            <div className="flex-shrink-0 mt-0.5">
              {msg.role === 'assistant' ? (
                <div className="w-6 h-6 rounded-full bg-wechat-green flex items-center justify-center text-white text-[10px]">AI</div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-wechat-text-secondary flex items-center justify-center text-white text-[10px]">我</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-small font-medium">{msg.role === 'assistant' ? 'AI' : '我'}</span>
                <span className="text-small text-wechat-text-light flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-small text-wechat-text-gray truncate">{msg.content.slice(0, 40)}</p>
            </div>
            <GitBranch size={14} className="text-wechat-text-light flex-shrink-0 mt-1" />
          </button>
        ))}
      </div>
    </Drawer>
  );
}
