import { useRef } from 'react';
import { Camera } from 'lucide-react';

interface AvatarProps {
  gradient?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  unreadCount?: number;
  src?: string;           // image URL or base64 data URL
  onUpload?: (dataUrl: string) => void;  // enables upload on click
}

const sizeMap = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12', xl: 'w-16 h-16' };
const dotSizeMap = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3', xl: 'w-3.5 h-3.5' };
const textSizeMap = { sm: 'text-xs', md: 'text-sm', lg: 'text-base', xl: 'text-xl' };
const iconSizeMap = { sm: 8, md: 12, lg: 14, xl: 18 } as const;

export default function Avatar({ gradient, name, size = 'md', online, unreadCount, src, onUpload }: AvatarProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (onUpload && fileRef.current) {
      fileRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpload(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const displayImage = src || (name ? undefined : null);
  const displayName = name || '?';
  const displayGradient = gradient || 'linear-gradient(135deg, #07c160, #06ad56)';
  const isImage = !!displayImage;

  return (
    <div
      className={`relative inline-flex flex-shrink-0 ${onUpload ? 'cursor-pointer group' : ''}`}
      onClick={handleClick}
    >
      {isImage ? (
        <img
          src={src}
          alt={displayName}
          className={`${sizeMap[size]} rounded-lg object-cover select-none`}
        />
      ) : (
        <div
          className={`${sizeMap[size]} rounded-lg flex items-center justify-center text-white font-semibold select-none ${textSizeMap[size]}`}
          style={{ background: displayGradient }}
        >
          {displayName[0]}
        </div>
      )}

      {/* Upload overlay */}
      {onUpload && (
        <>
          <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <Camera size={iconSizeMap[size]} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </>
      )}

      {/* Online dot */}
      {online !== undefined && (
        <span className={`absolute -bottom-0.5 -right-0.5 ${dotSizeMap[size]} rounded-full border-2 border-white ${online ? 'bg-wechat-green online-pulse' : 'bg-gray-300'}`} />
      )}

      {/* Unread badge */}
      {unreadCount !== undefined && unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-wechat-danger text-white text-[10px] font-medium px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
}
