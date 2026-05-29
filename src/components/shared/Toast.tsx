import { useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Toast() {
  const toastMessage = useAppStore(s => s.toastMessage);
  const clearToast = useAppStore(s => s.clearToast);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(clearToast, 2500);
    return () => clearTimeout(t);
  }, [toastMessage, clearToast]);

  if (!toastMessage) return null;

  const isWarning = toastMessage.includes('失败') || toastMessage.includes('错误');

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-slide-up">
      <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-lg text-body ${
        isWarning ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-white text-wechat-text border border-gray-100'
      }`}>
        {isWarning ? <AlertCircle size={16} className="text-wechat-danger" /> : <CheckCircle size={16} className="text-wechat-green" />}
        <span>{toastMessage}</span>
        <button onClick={clearToast} className="ml-2 p-0.5 hover:bg-gray-100 rounded">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
