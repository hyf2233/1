import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: 'left' | 'right';
  width?: string;
}

export default function Drawer({ open, onClose, title, children, side = 'right', width = 'w-80' }: DrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const isRight = side === 'right';
  const positionClass = isRight ? 'right-0' : 'left-0';
  const translateOut = isRight ? 'translate-x-full' : '-translate-x-full';

  return (
    <div className="fixed inset-0 z-50" ref={overlayRef}>
      <div
        className="fixed inset-0 bg-black/30 animate-fade-in"
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      />
      <div
        className={`fixed top-0 ${positionClass} h-full ${width} bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : translateOut}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-wechat-divider">
          <h2 className="text-subtitle font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors" id="drawer-close-btn">
            <X size={18} className="text-wechat-text-gray" />
          </button>
        </div>
        <div className="h-[calc(100%-57px)] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
