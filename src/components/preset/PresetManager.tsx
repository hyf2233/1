import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import Modal from '../shared/Modal';
import { Sliders, Plus, Trash2, Check, Upload, Download, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { createDefaultPreset } from '../../sillytavern/types';
import { importPreset, exportPreset, importJsonFileWithName, exportToJson } from '../../sillytavern/importer';
import type { ChatPreset } from '../../sillytavern/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Get a setting value with fallback */
function gs(settings: Record<string, any>, key: string, fallback: any = ''): any {
  return key in settings ? settings[key] : fallback;
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
  const [showPrompts, setShowPrompts] = useState(false);

  const handleCreate = async () => {
    const p = createDefaultPreset();
    const preset: ChatPreset = { ...p, id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now() };
    await addPreset(preset);
    showToast('预设已创建');
  };

  const handleImport = async () => {
    const result = await importJsonFileWithName<Record<string, any>>();
    if (!result) return;
    try {
      const p = importPreset(result.data, result.fileName);
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
  const s = editingPreset?.settings || {};

  const update = (patch: Partial<ChatPreset>) => {
    if (!editingPreset) return;
    updatePreset({ ...editingPreset, ...patch, updatedAt: Date.now() });
  };
  const us = (key: string, value: any) => {
    if (!editingPreset) return;
    updatePreset({ ...editingPreset, settings: { ...editingPreset.settings, [key]: value }, updatedAt: Date.now() });
  };

  // Count prompts
  const promptsArr: any[] = Array.isArray(s.prompts) ? s.prompts : [];
  const promptOrder: any[] = Array.isArray(s.prompt_order) ? s.prompt_order : [];

  return (
    <Modal open={open} onClose={onClose} title="预设管理" size="lg">
      <div className="space-y-3">
        {/* Action bar */}
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
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {presets.map(p => {
            const ps = p.settings || {};
            const promptCount = Array.isArray(ps.prompts) ? ps.prompts.length : 0;
            const active = activePresetId === p.id;
            return (
              <div key={p.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${active ? 'border-wechat-green bg-wechat-green-light' : 'border-wechat-divider'}`}>
                <Sliders size={18} className={active ? 'text-wechat-green' : 'text-wechat-text-gray'} />
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium truncate">{p.name}</p>
                  <p className="text-small text-wechat-text-light truncate">
                    temp: {ps.temperature ?? '?'} · top_p: {ps.top_p ?? '?'} · tokens: {ps.openai_max_tokens ?? '?'} · model: {ps.openai_model ?? '?'}
                    {promptCount > 0 ? ` · ${promptCount} prompts` : ''}
                  </p>
                </div>
                {active ? (
                  <span className="text-small text-wechat-green flex items-center gap-1 flex-shrink-0"><Check size={14} /> 使用中</span>
                ) : (
                  <button onClick={() => setActivePreset(p.id)}
                    className="text-small text-wechat-text-secondary hover:text-wechat-green transition-colors flex-shrink-0">启用</button>
                )}
                <button onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                  className="px-2 py-1 text-small hover:bg-gray-100 rounded transition-colors flex-shrink-0">编辑</button>
                <button onClick={() => handleExport(p.id)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0" title="导出"><Download size={14} className="text-wechat-text-gray" /></button>
                <button onClick={() => { removePreset(p.id); showToast('预设已删除'); }}
                  className="p-1 hover:bg-red-50 rounded transition-colors flex-shrink-0"><Trash2 size={14} className="text-wechat-danger" /></button>
              </div>
            );
          })}
        </div>

        {/* Expanded editor */}
        {editingPreset && (
          <div className="border border-wechat-green rounded-lg p-4 space-y-3 bg-wechat-green-light/30 max-h-[500px] overflow-y-auto">
            <h3 className="text-body font-semibold">编辑：{editingPreset.name}</h3>

            <div>
              <label className="text-small text-wechat-text-gray">名称</label>
              <input id="preset-name" type="text" value={editingPreset.name}
                onChange={e => update({ name: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none" />
            </div>

            {/* Sampling params — ST flat field names */}
            <div className="grid grid-cols-3 gap-3">
              {[
                ['temperature', 'Temperature', 0, 2, 0.1],
                ['top_p', 'Top P', 0, 1, 0.01],
                ['top_k', 'Top K', 0, 200, 1],
                ['min_p', 'Min P', 0, 1, 0.01],
                ['top_a', 'Top A', 0, 1, 0.01],
                ['repetition_penalty', 'Rep. Penalty', 1, 2, 0.01],
                ['frequency_penalty', 'Freq. Penalty', 0, 2, 0.1],
                ['presence_penalty', 'Pres. Penalty', 0, 2, 0.1],
                ['seed', 'Seed', -1, 999999, 1],
              ].map(([key, label, min, max, step]) => (
                <div key={String(key)}>
                  <label className="text-small text-wechat-text-gray">{String(label)}</label>
                  <input type="number" step={Number(step)} min={Number(min)} max={Number(max)} value={gs(s, String(key), String(key) === 'seed' ? -1 : String(key) === 'temperature' ? 0.8 : 0)}
                    onChange={e => us(String(key), Number(e.target.value))}
                    className="w-full mt-1 px-2 py-1.5 bg-white rounded-md text-body outline-none text-[13px]" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-small text-wechat-text-gray">Model</label>
                <input type="text" value={gs(s, 'openai_model', 'gpt-3.5-turbo')}
                  onChange={e => us('openai_model', e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none" />
              </div>
              <div>
                <label className="text-small text-wechat-text-gray">Max Context</label>
                <input type="number" value={gs(s, 'openai_max_context', 4096)}
                  onChange={e => us('openai_max_context', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none" />
              </div>
              <div>
                <label className="text-small text-wechat-text-gray">Max Tokens</label>
                <input type="number" value={gs(s, 'openai_max_tokens', 2048)}
                  onChange={e => us('openai_max_tokens', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none" />
              </div>
              <div>
                <label className="text-small text-wechat-text-gray">Reasoning Effort</label>
                <select value={gs(s, 'reasoning_effort', 'auto')} onChange={e => us('reasoning_effort', e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none">
                  <option value="auto">auto</option>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <label className="flex items-center gap-2 text-small cursor-pointer">
                <input type="checkbox" checked={gs(s, 'stream_openai', true)}
                  onChange={e => us('stream_openai', e.target.checked)} className="rounded" /> Stream
              </label>
              <label className="flex items-center gap-2 text-small cursor-pointer">
                <input type="checkbox" checked={gs(s, 'max_context_unlocked', false)}
                  onChange={e => us('max_context_unlocked', e.target.checked)} className="rounded" /> Max Context Unlocked
              </label>
              <label className="flex items-center gap-2 text-small cursor-pointer">
                <input type="checkbox" checked={gs(s, 'use_sysprompt', false)}
                  onChange={e => us('use_sysprompt', e.target.checked)} className="rounded" /> Use System Prompt
              </label>
              <label className="flex items-center gap-2 text-small cursor-pointer">
                <input type="checkbox" checked={gs(s, 'squash_system_messages', false)}
                  onChange={e => us('squash_system_messages', e.target.checked)} className="rounded" /> Squash System Messages
              </label>
            </div>

            {/* Prompts */}
            <div>
              <button onClick={() => setShowPrompts(!showPrompts)}
                className="flex items-center gap-1.5 text-small text-wechat-text-gray hover:text-wechat-green transition-colors">
                {showPrompts ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <FileText size={14} /> Prompts ({promptsArr.length}) · Prompt Order ({promptOrder.length})
              </button>
              {showPrompts && (
                <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto p-2 bg-white rounded-lg border">
                  {promptsArr.length === 0 ? (
                    <p className="text-small text-wechat-text-light text-center py-2">无自定义 prompts</p>
                  ) : (
                    promptsArr.slice(0, 50).map((p, i) => (
                      <div key={i} className="text-[11px] flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded">
                        <span className={p.enabled !== false ? 'text-wechat-green' : 'text-wechat-text-light/50'}>
                          {p.enabled !== false ? '●' : '○'}
                        </span>
                        <span className="text-wechat-text-gray font-medium truncate flex-1">{p.name || p.identifier || `#${i}`}</span>
                        <span className="text-wechat-text-light/50">{p.role || 'system'}</span>
                      </div>
                    ))
                  )}
                  {promptsArr.length > 50 && (
                    <p className="text-small text-wechat-text-light text-center">... 还有 {promptsArr.length - 50} 条</p>
                  )}
                </div>
              )}
            </div>

            {/* Advanced: key text prompts */}
            <button onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-small text-wechat-text-gray hover:text-wechat-green transition-colors">
              {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              高级 Prompt 字段
            </button>

            {showAdvanced && (
              <div className="space-y-3 pt-1 border-t border-wechat-divider">
                {[
                  ['impersonation_prompt', 'Impersonation Prompt'],
                  ['new_chat_prompt', 'New Chat Prompt'],
                  ['new_group_chat_prompt', 'New Group Chat Prompt'],
                  ['new_example_chat_prompt', 'New Example Chat Prompt'],
                  ['continue_nudge_prompt', 'Continue Nudge Prompt'],
                  ['group_nudge_prompt', 'Group Nudge Prompt'],
                  ['wi_format', 'World Info Format'],
                  ['scenario_format', 'Scenario Format'],
                  ['personality_format', 'Personality Format'],
                  ['assistant_prefill', 'Assistant Prefill'],
                  ['assistant_impersonation', 'Assistant Impersonation'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="text-small text-wechat-text-gray">{label}</label>
                    <textarea value={gs(s, key)} onChange={e => us(key, e.target.value)} rows={2}
                      className="w-full mt-1 px-3 py-2 bg-white rounded-md text-body outline-none resize-none font-mono text-[12px]" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
