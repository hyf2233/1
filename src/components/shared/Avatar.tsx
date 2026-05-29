interface AvatarProps {
  gradient: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  unreadCount?: number;
}

const sizeMap = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12', xl: 'w-16 h-16' };
const dotSizeMap = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3', xl: 'w-3.5 h-3.5' };
const textSizeMap = { sm: 'text-xs', md: 'text-sm', lg: 'text-base', xl: 'text-xl' };

export default function Avatar({ gradient, name, size = 'md', online, unreadCount }: AvatarProps) {
  return (
    <div className="relative inline-flex flex-shrink-0">
      <div
        className={`${sizeMap[size]} rounded-lg flex items-center justify-center text-white font-semibold select-none ${textSizeMap[size]}`}
        style={{ background: gradient }}
      >
        {name[0]}
      </div>
      {online !== undefined && (
        <span className={`absolute -bottom-0.5 -right-0.5 ${dotSizeMap[size]} rounded-full border-2 border-white ${online ? 'bg-wechat-green' : 'bg-gray-300'}`} />
      )}
      {unreadCount !== undefined && unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-wechat-danger text-white text-[10px] font-medium px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
}
