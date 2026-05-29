import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import type { Moment } from '../../types';
import { Heart, MessageCircle, MapPin } from 'lucide-react';

interface Props { moment: Moment; }

export default function MomentCard({ moment }: Props) {
  const likeMoment = useAppStore(s => s.likeMoment);
  const addComment = useAppStore(s => s.addComment);
  const contacts = useAppStore(s => s.contacts);
  const liked = moment.likes.includes('user');
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const author = moment.authorId === 'user'
    ? { name: '我', avatar: 'linear-gradient(135deg, #07c160, #06ad56)' }
    : contacts.find(c => c.id === moment.authorId);

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment(moment.id, {
      id: crypto.randomUUID(),
      authorId: 'user',
      authorName: '我',
      content: commentText,
      createdAt: '刚刚',
    });
    setCommentText('');
  };

  return (
    <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-semibold" style={{ background: moment.authorAvatar }}>
          {moment.authorName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body font-medium text-wechat-text-secondary">{moment.authorName}</p>
          <p className="text-body mt-1.5 whitespace-pre-wrap leading-relaxed">{moment.content}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-small text-wechat-text-light flex items-center gap-1">
              {moment.createdAt}
              {moment.location && <><MapPin size={10} />{moment.location}</>}
            </span>
            <div className="flex items-center gap-4">
              <button id={`like-${moment.id}`} onClick={() => likeMoment(moment.id)}
                className={`flex items-center gap-1 text-small transition-colors ${liked ? 'text-wechat-danger' : 'text-wechat-text-gray hover:text-wechat-danger'}`}>
                <Heart size={14} fill={liked ? '#FA5151' : 'none'} />{moment.likes.length || ''}
              </button>
              <button id={`comment-${moment.id}`} onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1 text-small text-wechat-text-gray hover:text-wechat-text-secondary transition-colors">
                <MessageCircle size={14} />{moment.comments.length || ''}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showComments && (
        <div className="mt-3 pt-3 border-t border-wechat-divider">
          {moment.comments.map(cm => (
            <div key={cm.id} className="mb-2">
              <span className="text-small font-medium text-wechat-text-secondary">{cm.authorName}</span>
              {cm.replyTo && <span className="text-small text-wechat-text-light"> 回复 {cm.replyTo} </span>}
              <span className="text-small">: {cm.content}</span>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input id={`comment-input-${moment.id}`} value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddComment(); }}
              placeholder="评论..."
              className="flex-1 bg-wechat-bg rounded px-3 py-1.5 text-small outline-none" />
          </div>
        </div>
      )}
    </div>
  );
}
