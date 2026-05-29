import ChatList from '../chat/ChatList';
import ChatDetail from '../chat/ChatDetail';
import { useAppStore } from '../../store/appStore';

export default function ChatPage() {
  const activeChatId = useAppStore(s => s.activeChatId);

  return (
    <div className="flex h-full">
      <ChatList />
      {activeChatId ? <ChatDetail /> : (
        <div className="flex-1 flex items-center justify-center bg-wechat-bg">
          <p className="text-wechat-text-gray text-body">选择一位联系人开始对话</p>
        </div>
      )}
    </div>
  );
}
