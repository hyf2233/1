import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import Avatar from '../shared/Avatar';
import { ChevronRight, Bookmark, Settings, Wallet, Smile, Sliders, BookOpen, Cog } from 'lucide-react';
import SettingsModal from '../settings/SettingsModal';
import LorebookManager from '../lorebook/LorebookManager';
import PresetManager from '../preset/PresetManager';

export default function ProfilePage() {
  const showToast = useAppStore(s => s.showToast);
  const [showSettings, setShowSettings] = useState(false);
  const [showLorebooks, setShowLorebooks] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const menuItems = [
    { icon: <Sliders size={20} />, label: 'API 设置', action: 'settings' },
    { icon: <BookOpen size={20} />, label: '世界书管理', action: 'lorebooks' },
    { icon: <Cog size={20} />, label: '预设管理', action: 'presets' },
    { icon: <Wallet size={20} />, label: '钱包' },
    { icon: <Smile size={20} />, label: '表情' },
    { icon: <Bookmark size={20} />, label: '收藏' },
    { icon: <Settings size={20} />, label: '设置' },
  ];

  const handleMenuClick = (action: string) => {
    switch (action) {
      case 'settings':
        setShowSettings(true);
        break;
      case 'lorebooks':
        setShowLorebooks(true);
        break;
      case 'presets':
        setShowPresets(true);
        break;
      default:
        showToast(`${action}页面开发中`);
    }
  };

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
            onClick={() => handleMenuClick((item as any).action || item.label)}
            className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-wechat-bg transition-colors ${i < menuItems.length - 1 ? 'border-b border-wechat-divider' : ''}`}>
            {item.icon}
            <span className="text-body flex-1">{item.label}</span>
            <ChevronRight size={16} className="text-wechat-text-light" />
          </div>
        ))}
      </div>

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      <LorebookManager open={showLorebooks} onClose={() => setShowLorebooks(false)} />
      <PresetManager open={showPresets} onClose={() => setShowPresets(false)} />
    </div>
  );
}
