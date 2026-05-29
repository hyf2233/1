import { Compass, Search, ScanLine, Package } from 'lucide-react';

export default function DiscoverPage() {
  const items = [
    { icon: <ScanLine size={22} />, label: '扫一扫', color: '#07C160' },
    { icon: <Package size={22} />, label: '小程序', color: '#1989FA' },
    { icon: <Search size={22} />, label: '搜一搜', color: '#FA5151' },
    { icon: <Compass size={22} />, label: '附近', color: '#FF9760' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-wechat-bg h-full">
      <div className="px-4 pt-8 pb-3 bg-white border-b border-wechat-divider">
        <h1 className="text-title">发现</h1>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item.label} id={`discover-${item.label}`}
            className="bg-white rounded-xl p-5 flex flex-col items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${item.color}15`, color: item.color }}>
              {item.icon}
            </div>
            <span className="text-body font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
