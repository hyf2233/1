import { useState, useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import Modal from '../shared/Modal';
import {
  Sliders, Plus, Trash2, Check, Upload, Download,
  ChevronDown, ChevronRight, Search, Eye, EyeOff, Settings2,
} from 'lucide-react';
import { createDefaultPreset } from '../../sillytavern/types';
import { importPreset, exportPreset, importJsonFileWithName, exportToJson } from '../../sillytavern/importer';
import type { ChatPreset } from '../../sillytavern/types';

interface Props { open: boolean; onClose: () => void; }

interface PromptItem {
  identifier: string;
  name?: string;
  enabled?: boolean;
  injection_position?: number;
  injection_depth?: number;
  injection_order?: number;
  role?: string;
  content?: string;
}

function gs(obj: Record<string, any>, key: string, fallback: any = ''): any {
  return key in obj ? obj[key] : fallback;
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
  const [showSampling, setShowSampling] = useState(false);
  const [promptSearch, setPromptSearch] = useState('');
  const [expandedPromptIdx, setExpandedPromptIdx] = useState<number | null>(null);

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

  // ── Prompts management ──
  const allPrompts: PromptItem[] = useMemo(() => {
    const raw = s.prompts;
    if (!Array.isArray(raw)) return [];
    return raw;
  }, [s.prompts]);

  const filteredPrompts = useMemo(() => {
    if (!promptSearch.trim()) return allPrompts;
    const q = promptSearch.toLowerCase();
    return allPrompts.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.identifier || '').toLowerCase().includes(q) ||
      (p.content || '').toLowerCase().includes(q)
    );
  }, [allPrompts, promptSearch]);

  const togglePrompt = (idx: number) => {
    const updated = allPrompts.map((p, i) =>
      i === idx ? { ...p, enabled: !(p.enabled !== false) } : p
    );
    us('prompts', updated);
  };

  const updatePrompt = (idx: number, patch: Partial<PromptItem>) => {
    const updated = allPrompts.map((p, i) => i === idx ? { ...p, ...patch } : p);
    us('prompts', updated);
  };

  // ── Import / Export ──
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
    } catch { showToast('导入失败：格式错误'); }
  };

  const handleExport = (id: string) => {
    const preset = presets.find(p => p.id === id);
    if (!preset) return;
    exportToJson(exportPreset(preset), `${preset.name}.json`);
    showToast('预设已导出');
  };

  const activeCount = allPrompts.filter(p => p.enabled !== false).length;

  // ── Render ──
  return (
    <Modal open={open} onClose={onClose} title="预设管理" size="lg">
      <div className="space-y-3">
        {/* Action bar */}
        <div className="flex gap-2">
          <button onClick={handleCreate} className="flex items-center gap-1.5 px-3 py-2 bg-wechat-green text-white rounded-md text-small font-medium hover:bg-wechat-green-dark transition-colors">
            <Plus size={14} /> 新建预设
          </button>
          <button onClick={handleImport} className="flex items-center gap-1.5 px-3 py-2 bg-wechat-bg rounded-md text-small font-medium hover:bg-gray-200 transition-colors">
            <Upload size={14} /> 导入预设
          </button>
        </div>

        {/* Preset list */}
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {presets.map(p => {
            const ps = p.settings || {};
            const promptCount = Array.isArray(ps.prompts) ? ps.prompts.length : 0;
            const active = activePresetId === p.id;
            return (
              <div key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border ${active ? 'border-wechat-green bg-wechat-green-light' : 'border-wechat-divider'}`}>
                <Sliders size={18} className={active ? 'text-wechat-green' : 'text-wechat-text-gray'} />
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium truncate">{p.name}</p>
                  <p className="text-small text-wechat-text-light truncate">
                    temp: {ps.temperature ?? '?'} · {promptCount} prompts · model: {ps.openai_model ?? '?'}
                  </p>
                </div>
                {active ? (
                  <span className="text-small text-wechat-green flex items-center gap-1 flex-shrink-0"><Check size={14} /> 使用中</span>
                ) : (
                  <button onClick={() => setActivePreset(p.id)} className="text-small text-wechat-text-secondary hover:text-wechat-green transition-colors flex-shrink-0">启用</button>
                )}
                <button onClick={() => setEditingId(editingId === p.id ? null : p.id)} className="px-2 py-1 text-small hover:bg-gray-100 rounded transition-colors flex-shrink-0">编辑</button>
                <button onClick={() => handleExport(p.id)} className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0" title="导出"><Download size={14} className="text-wechat-text-gray" /></button>
                <button onClick={() => { removePreset(p.id); showToast('预设已删除'); }} className="p-1 hover:bg-red-50 rounded transition-colors flex-shrink-0"><Trash2 size={14} className="text-wechat-danger" /></button>
              </div>
            );
          })}
        </div>

        {/* Editor */}
        {editingPreset && (
          <div className="border border-wechat-green rounded-lg p-4 space-y-3 bg-wechat-green-light/30 max-h-[60vh] flex flex-col">
            <div className="flex items-center gap-3">
              <h3 className="text-body font-semibold flex-1">编辑：{editingPreset.name}</h3>
              <button onClick={() => setShowSampling(!showSampling)}
                className="flex items-center gap-1 text-small text-wechat-text-gray hover:text-wechat-green transition-colors">
                <Settings2 size={14} /> 采样参数
              </button>
            </div>

            {/* Sampling params — collapsible */}
            {showSampling && (
              <div className="p-3 bg-white rounded-lg border space-y-2 flex-shrink-0">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['temperature', 'Temperature', 0, 2, 0.1],
                    ['top_p', 'Top P', 0, 1, 0.01],
                    ['top_k', 'Top K', 0, 200, 1],
                    ['min_p', 'Min P', 0, 1, 0.01],
                    ['repetition_penalty', 'Rep. Penalty', 1, 2, 0.01],
                    ['frequency_penalty', 'Freq. Penalty', 0, 2, 0.1],
                    ['presence_penalty', 'Pres. Penalty', 0, 2, 0.1],
                    ['openai_max_context', 'Max Context', 0, 2000000, 1000],
                    ['openai_max_tokens', 'Max Tokens', 0, 100000, 100],
                  ].map(([key, label, min, max, step]) => (
                    <div key={String(key)}>
                      <label className="text-[11px] text-wechat-text-gray">{String(label)}</label>
                      <input type="number" step={Number(step)} min={Number(min)} max={Number(max)}
                        value={gs(s, String(key), String(key) === 'temperature' ? 0.8 : 0)}
                        onChange={e => us(String(key), Number(e.target.value))}
                        className="w-full mt-0.5 px-2 py-1 bg-white rounded text-[12px] outline-none border border-gray-200" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={gs(s, 'openai_model', 'gpt-3.5-turbo')}
                    onChange={e => us('openai_model', e.target.value)}
                    placeholder="Model" className="flex-1 px-2 py-1 bg-white rounded text-[12px] outline-none border border-gray-200" />
                  <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                    <input type="checkbox" checked={gs(s, 'stream_openai', true)}
                      onChange={e => us('stream_openai', e.target.checked)} /> Stream
                  </label>
                </div>
              </div>
            )}

            {/* ═══ PROMPTS — the core of the preset ═══ */}
            <div className="flex items-center justify-between flex-shrink-0">
              <span className="text-small font-medium text-wechat-text-secondary">
                Prompts ({allPrompts.length}) · 激活 {activeCount}
              </span>
              <div className="flex items-center gap-1 bg-white rounded-md px-2 py-0.5 border border-gray-200">
                <Search size={12} className="text-wechat-text-light" />
                <input
                  placeholder="搜索提示词..." value={promptSearch}
                  onChange={e => setPromptSearch(e.target.value)}
                  className="bg-transparent text-[12px] outline-none w-36" />
              </div>
            </div>

            {/* Prompt list */}
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {filteredPrompts.length === 0 ? (
                <p className="text-small text-wechat-text-light text-center py-8">无匹配的提示词条目</p>
              ) : (
                filteredPrompts.map((p, displayIdx) => {
                  const origIdx = allPrompts.indexOf(p);
                  const enabled = p.enabled !== false;
                  const expanded = expandedPromptIdx === origIdx;
                  const hasContent = p.content && p.content.trim().length > 0;
                  return (
                    <div key={origIdx} className={`rounded-lg border ${enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50/50'}`}>
                      {/* Header row */}
                      <div className="flex items-center gap-2 p-2">
                        <button onClick={() => togglePrompt(origIdx)}
                          className="flex-shrink-0" title={enabled ? '禁用' : '启用'}>
                          {enabled ? <Eye size={14} className="text-wechat-green" /> : <EyeOff size={14} className="text-wechat-text-light/40" />}
                        </button>
                        <button onClick={() => setExpandedPromptIdx(expanded ? null : origIdx)}
                          className="flex-1 flex items-center gap-2 min-w-0 text-left">
                          {expanded ? <ChevronDown size={12} className="flex-shrink-0 text-wechat-text-light" /> : <ChevronRight size={12} className="flex-shrink-0 text-wechat-text-light" />}
                          <span className={`text-[12px] truncate ${enabled ? 'font-medium' : 'text-wechat-text-light/50'}`}>
                            {p.name || p.identifier || `#${origIdx}`}
                          </span>
                          {hasContent && !expanded && (
                            <span className="text-[10px] text-wechat-text-light/50 truncate hidden sm:inline">
                              {p.content!.slice(0, 60).replace(/\n/g, ' ')}...
                            </span>
                          )}
                        </button>
                        <span className="text-[10px] text-wechat-text-light/50 flex-shrink-0">{enabled ? 'ON' : 'OFF'}</span>
                      </div>

                      {/* Expanded content */}
                      {expanded && (
                        <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2">
                          <div className="flex gap-2 text-[11px]">
                            <span className="text-wechat-text-light">ID: {p.identifier}</span>
                            {p.role && <span className="text-wechat-text-light">role: {p.role}</span>}
                            {p.injection_position !== undefined && <span className="text-wechat-text-light">pos: {p.injection_position}</span>}
                            {p.injection_depth !== undefined && <span className="text-wechat-text-light">depth: {p.injection_depth}</span>}
                          </div>

                          {/* Content editor */}
                          <textarea
                            value={p.content || ''}
                            onChange={e => updatePrompt(origIdx, { content: e.target.value })}
                            rows={Math.min(12, Math.max(3, (p.content || '').split('\n').length))}
                            className="w-full px-3 py-2 bg-gray-50 rounded-md text-[12px] outline-none resize-none font-mono leading-relaxed border border-gray-200 focus:border-wechat-green"
                          />

                          {/* Name editor */}
                          <div className="flex gap-2">
                            <input type="text" value={p.name || ''}
                              onChange={e => updatePrompt(origIdx, { name: e.target.value })}
                              placeholder="条目名称" className="flex-1 px-2 py-1 bg-white rounded text-[11px] outline-none border border-gray-200" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
