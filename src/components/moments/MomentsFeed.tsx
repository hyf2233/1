import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import MomentCard from './MomentCard';
import Modal from '../shared/Modal';
import { Camera, MapPin } from 'lucide-react';

export default function MomentsFeed() {
  const moments = useAppStore(s => s.moments);
  const addMoment = useAppStore(s => s.addMoment);
  const showToast = useAppStore(s => s.showToast);
  const [showPublish, setShowPublish] = useState(false);
  const [publishText, setPublishText] = useState('');

  const handlePublish = () => {
    if (!publishText.trim()) return;
    addMoment({
      id: crypto.randomUUID(),
      authorId: 'user',
      authorName: '我',
      authorAvatar: 'linear-gradient(135deg, #07c160, #06ad56)',
      content: publishText,
      likes: [],
      comments: [],
      createdAt: '刚刚',
    });
    setPublishText('');
    setShowPublish(false);
    showToast('发布成功');
  };

  return (
    <div className="flex-1 flex flex-col bg-wechat-bg h-full overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-wechat-divider px-4 pt-8 pb-3 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-title">朋友圈</h1>
          <button id="publish-moment-btn" onClick={() => setShowPublish(true)}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
            <Camera size={20} className="text-wechat-text" />
          </button>
        </div>
      </div>

      <div className="px-4 py-3 space-y-0">
        {moments.map(moment => (
          <MomentCard key={moment.id} moment={moment} />
        ))}
      </div>

      <Modal open={showPublish} onClose={() => setShowPublish(false)} title="发布动态">
        <textarea id="publish-text" value={publishText} onChange={e => setPublishText(e.target.value)}
          placeholder="此刻的想法..."
          rows={4}
          className="w-full outline-none text-body resize-none placeholder:text-wechat-text-light"
        />
        <div className="flex items-center gap-3 mt-3 pb-2 border-b border-wechat-divider">
          <button className="p-1.5 hover:bg-gray-100 rounded transition-colors"><Camera size={20} className="text-wechat-text-gray" /></button>
          <button className="p-1.5 hover:bg-gray-100 rounded transition-colors"><MapPin size={20} className="text-wechat-text-gray" /></button>
        </div>
        <button id="submit-publish" onClick={handlePublish}
          className="w-full mt-4 py-2.5 bg-wechat-green text-white rounded-md font-medium hover:bg-wechat-green-dark transition-colors active:scale-[0.98]">
          发布
        </button>
      </Modal>
    </div>
  );
}
