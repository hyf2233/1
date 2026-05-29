import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import Modal from '../shared/Modal';
import { Sliders, Plus, Trash2, Check } from 'lucide-react';
import { createDefaultPreset } from '../../sillytavern/types';
import type { ChatPreset } from '../../sillytavern/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PresetManager({ open, onClose }: Props) {
  const presets = useAppStore(s => s.presets);
  const activePresetId = useAppStore(s => s.activePresetId);
  const addPreset = useAppStore(s => s.addPreset);
  const removePreset = useAppStore(s => s.removePreset);
  const setActivePreset = useAppStore(s => s.setActivePreset);
  const updatePreset = useAppStore(s => s.updatePreset);
  const showToast = useAppStore(s => s.showToast);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCreate = async () => {
    const p = createDefaultPreset();
    const preset: ChatPreset = { ...p, id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now() };
    await addPreset(preset);
    showToast('预设已创建');
  };

  const editingPreset = editingId ? presets.find(p => p.id === editingId) : null;

  return (
    <Modal open={open} onClose={onClose} title="预设管理" size="lg">
      <div className="space-y-3">
        <button
          id="create-preset-btn"
          onClick={handleCreate}
          className="flex items-center gap-1.5 px-3 py-2 bg-wechat-green text-white rounded-md text-small font-medium hover:bg-wechat-green-dark transition-colors"
        >
          <Plus size={14} /> 新建预设
        </button>

        <div className="space-y-2">
          {presets.map(p => (
            <div
              key={p.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${activePresetId === p.id ? 'border-wechat-green bg-wechat-green-light' : 'border-wechat-divider'}`}
            >
              <Sliders size={18} className={activePresetId === p.id ? 'text-wechat-green' : 'text-wechat-text-gray'} />
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium">{p.name}</p>
                <p className="text-small text-wechat-text-light">
                  temp: {p.settings.temp_openai ?? '?'} · max_tokens: {p.settings.openai_max_tokens ?? '?'} · model:{' '}
                  {p.settings.openai_model ?? '?'}
                </p>
              </div>
              {activePresetId === p.id ? (
                <span className="text-small text-wechat-green flex items-center gap-1">
                  <Check size={14} /> 使用中
                </span>
              ) : (
                <button
                  id={`activate-preset-${p.id}`}
                  onClick={() => setActivePreset(p.id)}
                  className="text-small text-wechat-text-secondary hover:text-wechat-green transition-colors"
                >
                  启用
                </button>
              )}
              <button
                id={`edit-preset-${p.id}`}
                onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                className="px-2 py-1 text-small hover:bg-gray-100 rounded transition-colors"
              >
                编辑
              </button>
              <button
                id={`delete-preset-${p.id}`}
                onClick={() => {
                  removePreset(p.id);
                  showToast('预设已删除');
                }}
                className="p-1 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 size={14} className="text-wechat-danger" />
              </button>
            </div>
          ))}
        </div>

        {/* Expanded preset editor */}
        {editingPreset && (
          <div className="border border-wechat-green rounded-lg p-4 space-y-3 bg-wechat-green-light/30">
            <h3 className="text-body font-semibold">编辑：{editingPreset.name}</h3>
            <div>
              <label className="text-small text-wechat-text-gray">名称</label>
              <input
                id="preset-name"
                type="text"
                value={editingPreset.name}
                onChange={e => updatePreset({ ...editingPreset, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-small text-wechat-text-gray">Temperature</label>
                <input
                  id="preset-temp"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={editingPreset.settings.temp_openai ?? 0.8}
                  onChange={e =>
                    updatePreset({
                      ...editingPreset,
                      settings: { ...editingPreset.settings, temp_openai: Number(e.target.value) },
                    })
                  }
                  className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none"
                />
              </div>
              <div>
                <label className="text-small text-wechat-text-gray">Max Tokens</label>
                <input
                  id="preset-max-tokens"
                  type="number"
                  value={editingPreset.settings.openai_max_tokens ?? 2048}
                  onChange={e =>
                    updatePreset({
                      ...editingPreset,
                      settings: { ...editingPreset.settings, openai_max_tokens: Number(e.target.value) },
                    })
                  }
                  className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none"
                />
              </div>
              <div>
                <label className="text-small text-wechat-text-gray">Top P</label>
                <input
                  id="preset-top-p"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={editingPreset.settings.top_p_openai ?? 0.9}
                  onChange={e =>
                    updatePreset({
                      ...editingPreset,
                      settings: { ...editingPreset.settings, top_p_openai: Number(e.target.value) },
                    })
                  }
                  className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none"
                />
              </div>
              <div>
                <label className="text-small text-wechat-text-gray">Frequency Penalty</label>
                <input
                  id="preset-freq-pen"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={editingPreset.settings.freq_pen_openai ?? 0}
                  onChange={e =>
                    updatePreset({
                      ...editingPreset,
                      settings: { ...editingPreset.settings, freq_pen_openai: Number(e.target.value) },
                    })
                  }
                  className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-small text-wechat-text-gray">
                Main Prompt (支持 {'{{user}}'} {'{{char}}'} {'{{original}}'} 宏)
              </label>
              <textarea
                id="preset-main-prompt"
                value={editingPreset.settings.main || ''}
                onChange={e =>
                  updatePreset({ ...editingPreset, settings: { ...editingPreset.settings, main: e.target.value } })
                }
                rows={3}
                className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none resize-none font-mono text-small"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
