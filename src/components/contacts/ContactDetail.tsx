import { useAppStore } from '../../store/appStore';
import Avatar from '../shared/Avatar';
import type { Contact } from '../../types';
import { MessageCircle, Phone, Star } from 'lucide-react';

interface Props { contact: Contact; onClose: () => void; }

export default function ContactDetail({ contact, onClose }: Props) {
  const chats = useAppStore(s => s.chats);
  const setActiveChat = useAppStore(s => s.setActiveChat);
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const updateContact = useAppStore(s => s.updateContact);

  const handleSendMsg = () => {
    const chat = chats.find(c => c.contactId === contact.id);
    if (chat) {
      setActiveChat(chat.id);
      setActiveTab('chat');
    }
    onClose();
  };

  return (
    <div className="flex flex-col items-center text-center">
      <Avatar
        gradient={contact.avatar}
        name={contact.name}
        size="xl"
        src={contact.avatarType === 'image' ? contact.avatarImage : undefined}
        onUpload={(dataUrl) => updateContact(contact.id, { avatarType: 'image', avatarImage: dataUrl })}
      />
      <h3 className="text-subtitle font-semibold mt-4">{contact.name}</h3>
      <p className="text-small text-wechat-text-gray mt-1">{contact.bio}</p>
      {contact.tags && (
        <div className="flex gap-2 mt-2">
          {contact.tags.map(t => (
            <span key={t} className="text-small px-2 py-0.5 rounded-full bg-wechat-green-light text-wechat-green">{t}</span>
          ))}
        </div>
      )}
      <div className="flex gap-6 mt-5">
        <button onClick={handleSendMsg} id="contact-send-msg"
          className="flex flex-col items-center gap-1.5 p-2 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="w-10 h-10 rounded-full bg-wechat-green flex items-center justify-center">
            <MessageCircle size={18} className="text-white" />
          </div>
          <span className="text-small text-wechat-text-gray">发消息</span>
        </button>
        <button id="contact-call"
          className="flex flex-col items-center gap-1.5 p-2 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="w-10 h-10 rounded-full bg-wechat-bg flex items-center justify-center">
            <Phone size={18} className="text-wechat-text" />
          </div>
          <span className="text-small text-wechat-text-gray">语音通话</span>
        </button>
        <button id="contact-star"
          className="flex flex-col items-center gap-1.5 p-2 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="w-10 h-10 rounded-full bg-wechat-bg flex items-center justify-center">
            <Star size={18} className="text-wechat-text" />
          </div>
          <span className="text-small text-wechat-text-gray">收藏</span>
        </button>
      </div>
      {contact.region && (
        <div className="w-full mt-5 pt-4 border-t border-wechat-divider text-left">
          <p className="text-small text-wechat-text-gray">地区</p>
          <p className="text-body mt-0.5">{contact.region}</p>
        </div>
      )}
      {contact.phone && (
        <div className="w-full mt-3 text-left">
          <p className="text-small text-wechat-text-gray">电话</p>
          <p className="text-body mt-0.5">{contact.phone}</p>
        </div>
      )}
    </div>
  );
}
