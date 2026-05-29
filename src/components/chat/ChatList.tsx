import { useAppStore } from '../../store/appStore';
import Avatar from '../shared/Avatar';
import { Search, Plus } from 'lucide-react';
import { useState } from 'react';

export default function ChatList() {
  const contacts = useAppStore(s => s.contacts);
  const chats = useAppStore(s => s.chats);
  const activeChatId = useAppStore(s => s.activeChatId);
  const setActiveChat = useAppStore(s => s.setActiveChat);
  const [search, setSearch] = useState('');

  const chatContacts = contacts.filter(c =>
    chats.some(ch => ch.contactId === c.id)
  );

  const filtered = search
    ? chatContacts.filter(c => c.name.includes(search) || (c.lastMessage && c.lastMessage.includes(search)))
    : chatContacts;

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return 0;
  });

  return (
    <div className="w-[280px] bg-white border-r border-wechat-divider flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-8 pb-3 flex items-center justify-between">
        <h1 className="text-title">聊天</h1>
        <button id="new-chat-btn" className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" title="新建聊天">
          <Plus size={20} className="text-wechat-text" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 bg-wechat-bg rounded-md px-3 py-1.5">
          <Search size={14} className="text-wechat-text-light flex-shrink-0" />
          <input
            id="chat-search-input"
            type="text"
            placeholder="搜索聊天"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-body outline-none w-full placeholder:text-wechat-text-light"
          />
        </div>
      </div>

      {/* Chat items */}
      <div className="flex-1 overflow-y-auto">
        {sorted.map(contact => {
          const chat = chats.find(c => c.contactId === contact.id);
          const isActive = activeChatId === chat?.id;

          return (
            <div
              key={contact.id}
              id={`chat-item-${contact.id}`}
              onClick={() => setActiveChat(chat?.id ?? null)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 hover:bg-wechat-bg ${
                isActive ? 'bg-wechat-green-light' : ''
              }`}
            >
              <Avatar gradient={contact.avatar} name={contact.name} size="lg" unreadCount={contact.unreadCount} src={contact.avatarType === 'image' ? contact.avatarImage : undefined} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-body font-medium truncate">{contact.name}</span>
                  <span className="text-small text-wechat-text-light flex-shrink-0 ml-2">{contact.lastMessageTime}</span>
                </div>
                <p className="text-caption text-wechat-text-gray truncate mt-0.5">{contact.lastMessage}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
