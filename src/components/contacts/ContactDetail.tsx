import { useAppStore } from '../../store/appStore';
import Avatar from '../shared/Avatar';
import type { Contact } from '../../types';
import { MessageCircle, Phone, Star, GraduationCap, BriefcaseBusiness, MapPin, Clock, Users } from 'lucide-react';

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
      {contact.bio && (
        <p className="text-small text-wechat-text-gray mt-1">{contact.bio}</p>
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

      {/* Contact info fields */}
      <div className="w-full mt-5 pt-4 border-t border-wechat-divider space-y-3 text-left">
        {contact.education && (
          <div className="flex items-center gap-3">
            <GraduationCap size={16} className="text-wechat-text-light flex-shrink-0" />
            <div>
              <p className="text-small text-wechat-text-gray">学历</p>
              <p className="text-body mt-0.5">{contact.education}</p>
            </div>
          </div>
        )}
        {contact.occupation && (
          <div className="flex items-center gap-3">
            <BriefcaseBusiness size={16} className="text-wechat-text-light flex-shrink-0" />
            <div>
              <p className="text-small text-wechat-text-gray">职业</p>
              <p className="text-body mt-0.5">{contact.occupation}</p>
            </div>
          </div>
        )}
        {contact.region && (
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-wechat-text-light flex-shrink-0" />
            <div>
              <p className="text-small text-wechat-text-gray">地区</p>
              <p className="text-body mt-0.5">{contact.region}</p>
            </div>
          </div>
        )}
        {contact.source && (
          <div className="flex items-center gap-3">
            <Users size={16} className="text-wechat-text-light flex-shrink-0" />
            <div>
              <p className="text-small text-wechat-text-gray">来源</p>
              <p className="text-body mt-0.5">{contact.source}</p>
            </div>
          </div>
        )}
        {contact.addedTime && (
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-wechat-text-light flex-shrink-0" />
            <div>
              <p className="text-small text-wechat-text-gray">添加时间</p>
              <p className="text-body mt-0.5">{contact.addedTime}</p>
            </div>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-3">
            <Phone size={16} className="text-wechat-text-light flex-shrink-0" />
            <div>
              <p className="text-small text-wechat-text-gray">电话</p>
              <p className="text-body mt-0.5">{contact.phone}</p>
            </div>
          </div>
        )}
        {contact.tags && contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {contact.tags.map(t => (
              <span key={t} className="text-small px-2 py-0.5 rounded-full bg-wechat-green-light text-wechat-green">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Hint about world book editing */}
      <div className="w-full mt-4 pt-4 border-t border-wechat-divider">
        <p className="text-[11px] text-wechat-text-light/60 leading-relaxed">
          此联系人信息同步自世界书「人物信息」。前往 <span className="text-wechat-green font-medium">我 → 世界书管理</span> 编辑对应条目可修改更多信息。
        </p>
      </div>
    </div>
  );
}
