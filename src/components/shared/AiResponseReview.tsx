import { useState } from 'react';
import { Check, X, Edit3 } from 'lucide-react';

interface Props {
  open: boolean;
  rawText: string;
  context: string;  // e.g. "聊天 · 苏晓月" or "通讯录搜索"
  onConfirm: (editedText: string) => void;
  onCancel: () => void;
}

export default function AiResponseReview({ open, rawText, context, onConfirm, onCancel }: Props) {
  const [edited, setEdited] = useState(rawText);
  const [changed, setChanged] = useState(false);

  // Sync when rawText changes
  if (rawText !== edited && !changed) {
    setEdited(rawText);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[700px] max-h-[80vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div>
            <h3 className="text-[16px] font-semibold">AI 原始回复</h3>
            <p className="text-[12px] text-wechat-text-gray mt-0.5">{context}</p>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X size={18} className="text-wechat-text-gray" />
          </button>
        </div>

        {/* Body — editable textarea */}
        <div className="flex-1 p-4 overflow-auto min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <Edit3 size={13} className="text-wechat-text-light" />
            <span className="text-[11px] text-wechat-text-light">
              {changed ? '已修改 — 下方为修改后的内容' : '以下是 AI 返回的原始内容，可直接编辑'}
            </span>
          </div>
          <textarea
            value={edited}
            onChange={e => { setEdited(e.target.value); setChanged(true); }}
            className="w-full h-[300px] px-4 py-3 bg-gray-50 rounded-lg text-[13px] outline-none resize-none font-mono leading-relaxed border border-gray-200 focus:border-wechat-green focus:ring-1 focus:ring-wechat-green/20"
            spellCheck={false}
          />
          {changed && (
            <button
              onClick={() => { setEdited(rawText); setChanged(false); }}
              className="mt-2 text-[11px] text-wechat-text-light hover:text-wechat-green transition-colors"
            >
              恢复原始内容
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50/50 rounded-b-xl">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-[14px] font-medium border border-gray-300 text-wechat-text-gray hover:bg-gray-100 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onConfirm(edited)}
            className="flex-1 py-2.5 rounded-lg text-[14px] font-medium bg-wechat-green text-white hover:bg-wechat-green-dark transition-colors flex items-center justify-center gap-2"
          >
            <Check size={16} />
            确认并处理
          </button>
        </div>
      </div>
    </div>
  );
}
