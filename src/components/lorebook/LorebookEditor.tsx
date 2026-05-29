import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import Modal from '../shared/Modal';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { createDefaultEntry } from '../../sillytavern/editor-utils';
import type { LorebookEntry } from '../../sillytavern/types';

interface Props {
  lorebookId: string;
  onClose: () => void;
}

const POSITIONS = [
  { value: 'before_char', label: '角色前' },
  { value: 'after_char', label: '角色后' },
  { value: 'before_example', label: '示例前' },
  { value: 'after_example', label: '示例后' },
  { value: 'at_depth', label: '深度触发' },
] as const;

export default function LorebookEditor({ lorebookId, onClose }: Props) {
  const lorebooks = useAppStore(s => s.lorebooks);
  const updateLorebook = useAppStore(s => s.updateLorebook);
  const showToast = useAppStore(s => s.showToast);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const book = lorebooks.find(l => l.id === lorebookId);
  if (!book) return null;

  const handleAddEntry = async () => {
    const entry = createDefaultEntry();
    const updated = { ...book, entries: [...book.entries, entry], updatedAt: Date.now() };
    await updateLorebook(updated);
  };

  const handleUpdateEntry = async (entryId: string, patch: Partial<LorebookEntry>) => {
    const updated = {
      ...book,
      entries: book.entries.map(e => (e.id === entryId ? { ...e, ...patch } : e)),
      updatedAt: Date.now(),
    };
    await updateLorebook(updated);
  };

  const handleDeleteEntry = async (entryId: string) => {
    const updated = { ...book, entries: book.entries.filter(e => e.id !== entryId), updatedAt: Date.now() };
    await updateLorebook(updated);
  };

  const handleRename = async (name: string) => {
    const updated = { ...book, name, updatedAt: Date.now() };
    await updateLorebook(updated);
  };

  return (
    <Modal open={true} onClose={onClose} title={`编辑世界书：${book.name}`} size="lg">
      <div className="space-y-3">
        <div>
          <label className="text-small text-wechat-text-gray">名称</label>
          <input
            id="lorebook-name"
            type="text"
            value={book.name}
            onChange={e => handleRename(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-wechat-bg rounded-md text-body outline-none"
          />
        </div>

        <button
          id="add-entry-btn"
          onClick={handleAddEntry}
          className="flex items-center gap-1.5 px-3 py-2 bg-wechat-green text-white rounded-md text-small font-medium hover:bg-wechat-green-dark transition-colors"
        >
          <Plus size={14} /> 添加条目
        </button>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {book.entries.map((entry, idx) => (
            <div key={entry.id} className="border border-wechat-divider rounded-lg">
              <button
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-wechat-bg transition-colors text-left"
              >
                <span className="text-body font-medium truncate">
                  #{idx + 1} {entry.keys.join(', ') || '未设置触发词'}
                </span>
                <span className="text-wechat-text-gray">
                  {expandedId === entry.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              {expandedId === entry.id && (
                <div className="px-3 pb-3 space-y-3">
                  <div>
                    <label className="text-small text-wechat-text-gray">触发词 (逗号分隔)</label>
                    <input
                      id={`entry-keys-${entry.id}`}
                      type="text"
                      value={entry.keys.join(', ')}
                      onChange={e =>
                        handleUpdateEntry(entry.id, {
                          keys: e.target.value
                            .split(',')
                            .map(k => k.trim())
                            .filter(Boolean),
                        })
                      }
                      className="w-full mt-1 px-3 py-2 bg-wechat-bg rounded-md text-body outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-small text-wechat-text-gray">内容 (当触发时注入到 Prompt 中)</label>
                    <textarea
                      id={`entry-content-${entry.id}`}
                      value={entry.content}
                      onChange={e => handleUpdateEntry(entry.id, { content: e.target.value })}
                      rows={4}
                      placeholder="写在这里的内容会在关键词触发时自动注入到 AI 的上下文中..."
                      className="w-full mt-1 px-3 py-2 bg-wechat-bg rounded-md text-body outline-none resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-small text-wechat-text-gray">位置</label>
                      <select
                        id={`entry-position-${entry.id}`}
                        value={entry.position}
                        onChange={e => handleUpdateEntry(entry.id, { position: e.target.value as LorebookEntry['position'] })}
                        className="w-full mt-1 px-3 py-2 bg-wechat-bg rounded-md text-body outline-none"
                      >
                        {POSITIONS.map(p => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-small text-wechat-text-gray">优先级</label>
                      <input
                        id={`entry-order-${entry.id}`}
                        type="number"
                        value={entry.order}
                        onChange={e => handleUpdateEntry(entry.id, { order: Number(e.target.value) })}
                        className="w-full mt-1 px-3 py-2 bg-wechat-bg rounded-md text-body outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-small cursor-pointer">
                      <input
                        type="checkbox"
                        checked={entry.constant}
                        onChange={e => handleUpdateEntry(entry.id, { constant: e.target.checked })}
                        className="rounded"
                      />
                      始终激活
                    </label>
                    <label className="flex items-center gap-2 text-small cursor-pointer">
                      <input
                        type="checkbox"
                        checked={entry.selective}
                        onChange={e => handleUpdateEntry(entry.id, { selective: e.target.checked })}
                        className="rounded"
                      />
                      二次触发
                    </label>
                  </div>
                  <button
                    id={`delete-entry-${entry.id}`}
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="flex items-center gap-1 text-small text-wechat-danger hover:underline"
                  >
                    <Trash2 size={12} /> 删除此条目
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
