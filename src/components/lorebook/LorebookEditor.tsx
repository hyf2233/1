import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import Modal from '../shared/Modal';
import { Plus, Trash2, ChevronDown, ChevronUp, Search, Hash } from 'lucide-react';
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

type TriggerMode = 'constant' | 'keyword' | 'secondary';

function getTriggerMode(entry: LorebookEntry): TriggerMode {
  if (entry.constant) return 'constant';
  if (entry.selective) return 'secondary';
  return 'keyword';
}

/** Extract a human-readable time/date label from entry content */
function extractTimeLabel(entry: LorebookEntry): string {
  // For character info entries: extract "添加时间" from content
  const addedMatch = entry.content.match(/添加时间：(.+)/);
  if (addedMatch) return addedMatch[1].trim();

  // For chat history entries: parse header 【🤖 苏晓月 · 2026/5/29 22:23:43】
  const headerMatch = entry.content.match(/【[^】]+·\s*([^】]+)】/);
  if (headerMatch) {
    const raw = headerMatch[1].trim();
    // Only return if it looks like a datetime (contains numbers and / or :)
    if (/\d{1,2}[\/-]\d{1,2}/.test(raw) || /\d{2}:\d{2}/.test(raw)) {
      const timeMatch = raw.match(/(\d{1,2}\/\d{1,2})\s+(\d{2}:\d{2})/);
      if (timeMatch) return `${timeMatch[1]} ${timeMatch[2]}`;
      return raw.slice(0, 14);
    }
    // Don't return plain names (like from character info headers)
    return '';
  }

  // Fallback: try to extract time from <chat time="..."> tag
  const chatMatch = entry.content.match(/<chat[^>]*time="([^"]*)"[^>]*>/);
  if (chatMatch) return chatMatch[1];
  return '';
}

/** Extract a display key label (first key or role name) from entry */
function extractKeyLabel(entry: LorebookEntry): string {
  if (entry.keys.length > 0) return entry.keys[0];
  return '未设置触发词';
}

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
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-body font-medium flex-shrink-0">#{idx + 1}</span>
                  {extractTimeLabel(entry) && (
                    <span className="text-[12px] text-wechat-text-light flex-shrink-0">{extractTimeLabel(entry)}</span>
                  )}
                  <span className="text-[12px] text-wechat-green font-medium truncate">{extractKeyLabel(entry)}</span>
                </div>
                <span className="text-wechat-text-gray flex-shrink-0">
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
                  {/* Trigger mode — 3 modes */}
                  <div>
                    <label className="text-small text-wechat-text-gray">触发模式</label>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1.5">
                      <label className="flex items-center gap-1.5 text-small cursor-pointer">
                        <input
                          type="radio"
                          name={`trigger-${entry.id}`}
                          checked={getTriggerMode(entry) === 'constant'}
                          onChange={() => handleUpdateEntry(entry.id, { constant: true, selective: false })}
                          className="accent-blue-500"
                        />
                        <span className={getTriggerMode(entry) === 'constant' ? 'text-blue-600 font-medium' : ''}>始终触发</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-small cursor-pointer">
                        <input
                          type="radio"
                          name={`trigger-${entry.id}`}
                          checked={getTriggerMode(entry) === 'keyword'}
                          onChange={() => handleUpdateEntry(entry.id, { constant: false, selective: false })}
                          className="accent-green-500"
                        />
                        <span className={getTriggerMode(entry) === 'keyword' ? 'text-green-600 font-medium' : ''}>关键词触发</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-small cursor-pointer">
                        <input
                          type="radio"
                          name={`trigger-${entry.id}`}
                          checked={getTriggerMode(entry) === 'secondary'}
                          onChange={() => handleUpdateEntry(entry.id, { constant: false, selective: true })}
                          className="accent-orange-500"
                        />
                        <span className={getTriggerMode(entry) === 'secondary' ? 'text-orange-600 font-medium' : ''}>二次触发</span>
                      </label>
                    </div>
                  </div>

                  {/* Secondary keys — only show when 二次触发 */}
                  {getTriggerMode(entry) === 'secondary' && (
                    <div>
                      <label className="text-small text-wechat-text-gray">次触发词 (逗号分隔)</label>
                      <input
                        id={`entry-secondary-keys-${entry.id}`}
                        type="text"
                        value={entry.secondaryKeys.join(', ')}
                        onChange={e =>
                          handleUpdateEntry(entry.id, {
                            secondaryKeys: e.target.value
                              .split(',')
                              .map(k => k.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="次关键词..."
                        className="w-full mt-1 px-3 py-2 bg-wechat-bg rounded-md text-body outline-none"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={entry.addMemo}
                      onChange={e => handleUpdateEntry(entry.id, { addMemo: e.target.checked })}
                      className="rounded"
                    />
                    添加到记忆
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
