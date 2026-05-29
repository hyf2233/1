import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Toast() {
  const toastMessage = useAppStore(s => s.toastMessage);
  const clearToast = useAppStore(s => s.clearToast);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (toastMessage) {
      setVisible(true);
      setExiting(false);
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          setVisible(false);
          clearToast();
        }, 200);
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, clearToast]);

  if (!visible || !toastMessage) return null;

  const isError = toastMessage.includes('失败') || toastMessage.includes('错误');

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <div
        className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl border backdrop-blur-md ${
          exiting ? 'toast-exit' : 'toast-enter'
        }`}
        style={{
          background: 'rgba(30, 30, 30, 0.94)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        {isError ? (
          <AlertCircle size={15} className="text-wechat-danger flex-shrink-0" />
        ) : (
          <CheckCircle size={15} className="text-wechat-green flex-shrink-0" />
        )}
        <span className="text-[13px] text-white/90 font-medium leading-snug">
          {toastMessage}
        </span>
        <button
          onClick={() => { setExiting(true); setTimeout(clearToast, 200); }}
          className="flex-shrink-0 p-0.5 rounded-full hover:bg-white/10 transition-colors duration-150 ml-1"
        >
          <X size={12} className="text-white/40" />
        </button>
      </div>
    </div>
  );
}
