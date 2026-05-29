import { useAppStore } from '../../store/appStore';
import type { TabId, TabDefinition } from '../../types';
import { MessageCircle, Users, Globe, Compass, User } from 'lucide-react';

const tabs: TabDefinition[] = [
  { id: 'chat', label: '聊天', icon: 'message-circle' },
  { id: 'contacts', label: '通讯录', icon: 'users' },
  { id: 'moments', label: '朋友圈', icon: 'globe' },
  { id: 'discover', label: '发现', icon: 'compass' },
  { id: 'profile', label: '我', icon: 'user' },
];

const iconMap: Record<string, React.ReactNode> = {
  'message-circle': <MessageCircle size={22} />,
  'users': <Users size={22} />,
  'globe': <Globe size={22} />,
  'compass': <Compass size={22} />,
  'user': <User size={22} />,
};

export default function Sidebar() {
  const activeTab = useAppStore(s => s.activeTab);
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const chats = useAppStore(s => s.chats);
  const contacts = useAppStore(s => s.contacts);

  const totalUnread = chats.reduce((sum, c) => {
    const contact = contacts.find(co => co.id === c.contactId);
    return sum + (contact?.unreadCount ?? 0);
  }, 0);

  return (
    <aside className="w-[72px] bg-[#2E2E2E] flex flex-col items-center pt-4 pb-6 h-full select-none">
      {/* Logo area */}
      <div className="w-10 h-10 rounded-xl bg-wechat-green flex items-center justify-center mb-6">
        <MessageCircle size={20} className="text-white" fill="white" />
      </div>

      {/* Tab icons */}
      <nav className="flex-1 flex flex-col gap-0 w-full">
        {tabs.map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`sidebar-item relative transition-transform duration-150 hover:scale-105 active:scale-95 ${activeTab === tab.id ? 'active' : ''}`}
            title={tab.label}
          >
            {iconMap[tab.icon]}
            <span className="text-[10px] leading-none">{tab.label}</span>
            {tab.id === 'chat' && totalUnread > 0 && (
              <span className="absolute top-3 right-3 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-wechat-danger text-white text-[9px] px-1">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}
