import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import Modal from '../shared/Modal';
import { Sliders, Plus, Trash2, Check, Upload, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { createDefaultPreset } from '../../sillytavern/types';
import { importPreset, exportPreset, importJsonFile, exportToJson } from '../../sillytavern/importer';
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleCreate = async () => {
    const p = createDefaultPreset();
    const preset: ChatPreset = { ...p, id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now() };
    await addPreset(preset);
    showToast('预设已创建');
  };

  const handleImport = async () => {
    const data = await importJsonFile<Record<string, any>>();
    if (!data) return;
    try {
      const p = importPreset(data);
      const preset: ChatPreset = { ...p, id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now() };
      await addPreset(preset);
      showToast(`预设 "${preset.name}" 导入成功`);
    } catch {
      showToast('导入失败：格式错误');
    }
  };

  const handleExport = (id: string) => {
    const preset = presets.find(p => p.id === id);
    if (!preset) return;
    const data = exportPreset(preset);
    exportToJson(data, `${preset.name}.json`);
    showToast('预设已导出');
  };

  const editingPreset = editingId ? presets.find(p => p.id === editingId) : null;

  const update = (patch: Partial<ChatPreset>) => {
    if (!editingPreset) return;
    updatePreset({ ...editingPreset, ...patch, updatedAt: Date.now() });
  };

  const updateSetting = (key: string, value: any) => {
    if (!editingPreset) return;
    updatePreset({
      ...editingPreset,
      settings: { ...editingPreset.settings, [key]: value },
      updatedAt: Date.now(),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="预设管理" size="lg">
      <div className="space-y-3">
        {/* Action buttons */}
        <div className="flex gap-2">
          <button id="create-preset-btn" onClick={handleCreate}
            className="flex items-center gap-1.5 px-3 py-2 bg-wechat-green text-white rounded-md text-small font-medium hover:bg-wechat-green-dark transition-colors">
            <Plus size={14} /> 新建预设
          </button>
          <button id="import-preset-btn" onClick={handleImport}
            className="flex items-center gap-1.5 px-3 py-2 bg-wechat-bg rounded-md text-small font-medium hover:bg-gray-200 transition-colors">
            <Upload size={14} /> 导入预设
          </button>
        </div>

        {/* Preset list */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {presets.map(p => (
            <div key={p.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${activePresetId === p.id ? 'border-wechat-green bg-wechat-green-light' : 'border-wechat-divider'}`}>
              <Sliders size={18} className={activePresetId === p.id ? 'text-wechat-green' : 'text-wechat-text-gray'} />
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium">{p.name}</p>
                <p className="text-small text-wechat-text-light">
                  temp: {p.settings.temp_openai ?? '?'} · tokens: {p.settings.openai_max_tokens ?? '?'} · model: {p.settings.openai_model ?? '?'}
                  {p.settings.stream_openai ? ' · stream' : ''}
                </p>
              </div>
              {activePresetId === p.id ? (
                <span className="text-small text-wechat-green flex items-center gap-1"><Check size={14} /> 使用中</span>
              ) : (
                <button id={`activate-preset-${p.id}`} onClick={() => setActivePreset(p.id)}
                  className="text-small text-wechat-text-secondary hover:text-wechat-green transition-colors">启用</button>
              )}
              <button id={`edit-preset-${p.id}`} onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                className="px-2 py-1 text-small hover:bg-gray-100 rounded transition-colors">编辑</button>
              <button id={`export-preset-${p.id}`} onClick={() => handleExport(p.id)}
                className="p-1 hover:bg-gray-100 rounded transition-colors" title="导出"><Download size={14} className="text-wechat-text-gray" /></button>
              <button id={`delete-preset-${p.id}`} onClick={() => { removePreset(p.id); showToast('预设已删除'); }}
                className="p-1 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} className="text-wechat-danger" /></button>
            </div>
          ))}
        </div>

        {/* Expanded preset editor */}
        {editingPreset && (
          <div className="border border-wechat-green rounded-lg p-4 space-y-3 bg-wechat-green-light/30">
            <h3 className="text-body font-semibold">编辑：{editingPreset.name}</h3>

            {/* Basic */}
            <div>
              <label className="text-small text-wechat-text-gray">名称</label>
              <input id="preset-name" type="text" value={editingPreset.name}
                onChange={e => update({ name: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-small text-wechat-text-gray">Temperature</label>
                <input id="preset-temp" type="number" step="0.1" min="0" max="2" value={editingPreset.settings.temp_openai ?? 0.8}
                  onChange={e => updateSetting('temp_openai', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none" />
              </div>
              <div>
                <label className="text-small text-wechat-text-gray">Max Context</label>
                <input id="preset-max-ctx" type="number" value={editingPreset.settings.openai_max_context ?? 4096}
                  onChange={e => updateSetting('openai_max_context', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none" />
              </div>
              <div>
                <label className="text-small text-wechat-text-gray">Max Tokens</label>
                <input id="preset-max-tokens" type="number" value={editingPreset.settings.openai_max_tokens ?? 2048}
                  onChange={e => updateSetting('openai_max_tokens', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none" />
              </div>
              <div>
                <label className="text-small text-wechat-text-gray">Model</label>
                <input id="preset-model" type="text" value={editingPreset.settings.openai_model ?? ''}
                  onChange={e => updateSetting('openai_model', e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none" />
              </div>
              <div>
                <label className="text-small text-wechat-text-gray">Top P</label>
                <input id="preset-top-p" type="number" step="0.01" min="0" max="1" value={editingPreset.settings.top_p_openai ?? 0.9}
                  onChange={e => updateSetting('top_p_openai', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none" />
              </div>
              <div>
                <label className="text-small text-wechat-text-gray">Frequency Penalty</label>
                <input id="preset-freq-pen" type="number" step="0.1" min="0" max="2" value={editingPreset.settings.freq_pen_openai ?? 0}
                  onChange={e => updateSetting('freq_pen_openai', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none" />
              </div>
              <div>
                <label className="text-small text-wechat-text-gray">Presence Penalty</label>
                <input id="preset-pres-pen" type="number" step="0.1" min="0" max="2" value={editingPreset.settings.pres_pen_openai ?? 0}
                  onChange={e => updateSetting('pres_pen_openai', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none" />
              </div>
              <div>
                <label className="text-small text-wechat-text-gray">Min P</label>
                <input id="preset-min-p" type="number" step="0.01" min="0" max="1" value={editingPreset.settings.min_p_openai ?? 0}
                  onChange={e => updateSetting('min_p_openai', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-small cursor-pointer">
                <input type="checkbox" checked={editingPreset.settings.stream_openai ?? false}
                  onChange={e => updateSetting('stream_openai', e.target.checked)} className="rounded" />
                启用流式输出 (Stream)
              </label>
            </div>

            {/* Prompts */}
            <div>
              <label className="text-small text-wechat-text-gray">
                Main Prompt (支持 {'{{user}}'} {'{{char}}'} {'{{original}}'})
              </label>
              <textarea id="preset-main" value={editingPreset.settings.main || ''}
                onChange={e => updateSetting('main', e.target.value)} rows={4}
                className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none resize-none font-mono text-small" />
            </div>

            <div>
              <label className="text-small text-wechat-text-gray">Jailbreak Prompt</label>
              <textarea id="preset-jailbreak" value={editingPreset.settings.jailbreak || ''}
                onChange={e => updateSetting('jailbreak', e.target.value)} rows={2}
                className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none resize-none font-mono text-small" />
            </div>

            {/* Advanced section toggle */}
            <button onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-small text-wechat-text-gray hover:text-wechat-green transition-colors">
              {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              高级设定
            </button>

            {showAdvanced && (
              <div className="space-y-3 pt-1 border-t border-wechat-divider">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-small text-wechat-text-gray">Top K</label>
                    <input type="number" min="0" value={editingPreset.settings.top_k_openai ?? 0}
                      onChange={e => updateSetting('top_k_openai', Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none" />
                  </div>
                  <div>
                    <label className="text-small text-wechat-text-gray">Top A</label>
                    <input type="number" step="0.01" min="0" max="1" value={editingPreset.settings.top_a_openai ?? 0}
                      onChange={e => updateSetting('top_a_openai', Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none" />
                  </div>
                  <div>
                    <label className="text-small text-wechat-text-gray">Repetition Penalty</label>
                    <input type="number" step="0.01" min="1" max="2" value={editingPreset.settings.repetition_penalty_openai ?? 1}
                      onChange={e => updateSetting('repetition_penalty_openai', Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-small text-wechat-text-gray">NSFW Prompt</label>
                  <textarea value={editingPreset.settings.nsfw || ''}
                    onChange={e => updateSetting('nsfw', e.target.value)} rows={2}
                    className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none resize-none font-mono text-small" />
                </div>
                <div>
                  <label className="text-small text-wechat-text-gray">Enhance Definitions</label>
                  <textarea value={editingPreset.settings.enhanceDefinitions || ''}
                    onChange={e => updateSetting('enhanceDefinitions', e.target.value)} rows={2}
                    className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none resize-none font-mono text-small" />
                </div>
                <div>
                  <label className="text-small text-wechat-text-gray">Impersonation Prompt</label>
                  <textarea value={editingPreset.settings.impersonation_prompt || ''}
                    onChange={e => updateSetting('impersonation_prompt', e.target.value)} rows={2}
                    className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none resize-none font-mono text-small" />
                </div>
                <div>
                  <label className="text-small text-wechat-text-gray">New Chat Prompt</label>
                  <textarea value={editingPreset.settings.new_chat_prompt || ''}
                    onChange={e => updateSetting('new_chat_prompt', e.target.value)} rows={2}
                    className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none resize-none font-mono text-small" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
