import { useAppStore } from '../../store/appStore';
import Avatar from '../shared/Avatar';
import { ChevronRight, Bookmark, Settings, Wallet, Smile } from 'lucide-react';

export default function ProfilePage() {
  const showToast = useAppStore(s => s.showToast);
  const menuItems = [
    { icon: <Wallet size={20} />, label: '钱包' },
    { icon: <Smile size={20} />, label: '表情' },
    { icon: <Bookmark size={20} />, label: '收藏' },
    { icon: <Settings size={20} />, label: '设置' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-wechat-bg h-full overflow-y-auto">
      <div className="bg-white">
        <div className="px-4 pt-8 pb-3">
          <h1 className="text-title">我</h1>
        </div>
        <div className="flex items-center gap-4 px-4 py-6 cursor-pointer hover:bg-wechat-bg transition-colors">
          <Avatar gradient="linear-gradient(135deg, #07c160, #06ad56)" name="我" size="xl" />
          <div className="flex-1">
            <h2 className="text-subtitle font-semibold">我的名字</h2>
            <p className="text-small text-wechat-text-gray mt-0.5">微信号: adventures_2026</p>
          </div>
          <ChevronRight size={18} className="text-wechat-text-light" />
        </div>
      </div>
      <div className="mt-3 bg-white">
        {menuItems.map((item, i) => (
          <div key={item.label} id={`profile-${item.label}`}
            onClick={() => showToast(`${item.label}页面开发中`)}
            className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-wechat-bg transition-colors ${i < menuItems.length - 1 ? 'border-b border-wechat-divider' : ''}`}>
            {item.icon}
            <span className="text-body flex-1">{item.label}</span>
            <ChevronRight size={16} className="text-wechat-text-light" />
          </div>
        ))}
      </div>
    </div>
  );
}
