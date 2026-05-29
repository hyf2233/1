import { useAppStore } from '../../store/appStore';
import Drawer from '../shared/Drawer';
import { GitBranch, Clock, Trash2 } from 'lucide-react';

export default function HistoryDrawer() {
  const showHistoryDrawer = useAppStore(s => s.showHistoryDrawer);
  const toggleHistoryDrawer = useAppStore(s => s.toggleHistoryDrawer);
  const activeChat = useAppStore(s => s.activeChat);
  const backtrackTo = useAppStore(s => s.backtrackTo);
  const deleteMessage = useAppStore(s => s.deleteMessage);
  const chat = activeChat();

  if (!chat) return null;

  const handleBacktrack = (messageId: string) => {
    backtrackTo(messageId);
    toggleHistoryDrawer();
  };

  const handleDelete = (messageId: string) => {
    deleteMessage(chat.id, messageId);
  };

  return (
    <Drawer open={showHistoryDrawer} onClose={toggleHistoryDrawer} title="对话记录" side="left" width="w-72">
      <div className="p-3">
        <p className="text-small text-wechat-text-gray mb-3">
          共 {chat.messages.length} 条消息。点击回溯到此位置，删除将移除此消息。
        </p>
        {chat.messages.map((msg, idx) => (
          <div
            key={msg.id}
            id={`history-msg-${msg.id}`}
            className="w-full flex items-start gap-2 p-2 rounded-md hover:bg-wechat-bg transition-colors border-b border-wechat-divider last:border-0"
          >
            <button
              onClick={() => handleBacktrack(msg.id)}
              className="flex-1 flex items-start gap-2 text-left min-w-0"
            >
              <div className="flex-shrink-0 mt-0.5">
                {msg.role === 'assistant' ? (
                  <div className="w-5 h-5 rounded-full bg-wechat-green flex items-center justify-center text-white text-[9px]">AI</div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-wechat-text-secondary flex items-center justify-center text-white text-[9px]">我</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-small font-medium">{msg.role === 'assistant' ? 'AI' : '我'}</span>
                  <span className="text-small text-wechat-text-light flex items-center gap-0.5">
                    <Clock size={9} />
                    {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-small text-wechat-text-light ml-auto">#{idx + 1}</span>
                </div>
                <p className="text-small text-wechat-text-gray truncate">{msg.content.slice(0, 50)}</p>
              </div>
            </button>
            <div className="flex flex-col gap-0.5 flex-shrink-0 mt-0.5">
              <button
                onClick={() => handleBacktrack(msg.id)}
                className="p-0.5 hover:text-wechat-green transition-colors"
                title="回溯到此"
              >
                <GitBranch size={12} className="text-wechat-text-light" />
              </button>
              <button
                onClick={() => handleDelete(msg.id)}
                className="p-0.5 hover:text-wechat-danger transition-colors"
                title="删除消息"
              >
                <Trash2 size={12} className="text-wechat-text-light" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Drawer>
  );
}
