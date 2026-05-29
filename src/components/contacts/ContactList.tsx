import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import Avatar from '../shared/Avatar';
import Modal from '../shared/Modal';
import ContactDetail from './ContactDetail';
import { Search, Tag, ChevronRight } from 'lucide-react';
import { tagGroups, tagColors } from '../../data/contacts';

export default function ContactList() {
  const contacts = useAppStore(s => s.contacts);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? contacts.find(c => c.id === selectedId) ?? null : null;

  const filtered = search ? contacts.filter(c => c.name.includes(search)) : contacts;

  const grouped: Record<string, typeof contacts> = {};
  filtered.forEach(c => {
    const letter = c.name[0];
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(c);
  });

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      <div className="px-4 pt-8 pb-3">
        <h1 className="text-title">通讯录</h1>
      </div>

      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 bg-wechat-bg rounded-md px-3 py-1.5">
          <Search size={14} className="text-wechat-text-light" />
          <input id="contact-search" type="text" placeholder="搜索联系人" value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-body outline-none w-full" />
        </div>
      </div>

      {/* Tag groups */}
      <div className="px-4 py-2 border-b border-wechat-divider">
        {Object.entries(tagGroups).map(([tag, ids]) => (
          <div key={tag} className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-wechat-bg rounded-md px-2 transition-colors">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: tagColors[tag] || '#ccc' }}>
              <Tag size={16} className="text-white" />
            </div>
            <span className="text-body flex-1">{tag}</span>
            <span className="text-small text-wechat-text-light">{ids.length}</span>
            <ChevronRight size={14} className="text-wechat-text-light" />
          </div>
        ))}
      </div>

      {/* Contact A-Z list */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(grouped).map(([letter, items]) => (
          <div key={letter}>
            <div className="px-4 py-1.5 bg-wechat-bg text-small text-wechat-text-gray font-medium">{letter}</div>
            {items.map(c => (
              <div key={c.id} id={`contact-${c.id}`}
                onClick={() => setSelectedId(c.id)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-wechat-bg cursor-pointer transition-colors border-b border-wechat-divider last:border-0">
                <Avatar gradient={c.avatar} name={c.name} size="lg" src={c.avatarType === 'image' ? c.avatarImage : undefined} />
                <div className="flex-1">
                  <p className="text-body">{c.name}</p>
                  {c.tags && <p className="text-small text-wechat-text-gray">{c.tags.join(' · ')}</p>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <Modal open={!!selected} onClose={() => setSelectedId(null)} title="联系人详情">
        {selected && <ContactDetail contact={selected} onClose={() => setSelectedId(null)} />}
      </Modal>
    </div>
  );
}
