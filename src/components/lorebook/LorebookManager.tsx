import { useState, useRef } from 'react';
import { useAppStore } from '../../store/appStore';
import Modal from '../shared/Modal';
import LorebookEditor from './LorebookEditor';
import { BookOpen, Plus, Trash2, Upload, Download, Edit3 } from 'lucide-react';
import { createDefaultLorebook } from '../../sillytavern/editor-utils';
import { exportLorebook, importJsonFile, exportToJson } from '../../sillytavern/importer';
import type { SillyTavernLorebookExport } from '../../sillytavern/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function LorebookManager({ open, onClose }: Props) {
  const lorebooks = useAppStore(s => s.lorebooks);
  const activeLorebookIds = useAppStore(s => s.activeLorebookIds);
  const addLorebook = useAppStore(s => s.addLorebook);
  const removeLorebook = useAppStore(s => s.removeLorebook);
  const toggleActiveLorebook = useAppStore(s => s.toggleActiveLorebook);
  const updateLorebook = useAppStore(s => s.updateLorebook);
  const showToast = useAppStore(s => s.showToast);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCreate = async () => {
    const lb = createDefaultLorebook('新世界书');
    await addLorebook({ ...lb, id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now() });
    showToast('世界书已创建');
  };

  const handleDelete = async (id: string) => {
    await removeLorebook(id);
    showToast('世界书已删除');
  };

  const handleImport = async () => {
    const data = await importJsonFile<SillyTavernLorebookExport>();
    if (!data) return;
    try {
      const { importLorebook } = await import('../../sillytavern/importer');
      const lb = importLorebook(data);
      await addLorebook({ ...lb, id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now() });
      showToast('世界书导入成功');
    } catch {
      showToast('导入失败：格式错误');
    }
  };

  const handleExport = (id: string) => {
    const lb = lorebooks.find(b => b.id === id);
    if (!lb) return;
    const data = exportLorebook(lb);
    exportToJson(data, `${lb.name}.json`);
    showToast('世界书已导出');
  };

  return (
    <Modal open={open} onClose={onClose} title="世界书管理" size="lg">
      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            id="create-lorebook-btn"
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-3 py-2 bg-wechat-green text-white rounded-md text-small font-medium hover:bg-wechat-green-dark transition-colors"
          >
            <Plus size={14} /> 新建
          </button>
          <button
            id="import-lorebook-btn"
            onClick={handleImport}
            className="flex items-center gap-1.5 px-3 py-2 bg-wechat-bg rounded-md text-small font-medium hover:bg-gray-200 transition-colors"
          >
            <Upload size={14} /> 导入
          </button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {lorebooks.map(lb => {
            const isActive = activeLorebookIds.includes(lb.id);
            return (
              <div
                key={lb.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isActive ? 'border-wechat-green bg-wechat-green-light' : 'border-wechat-divider bg-white'}`}
              >
                <BookOpen size={18} className={isActive ? 'text-wechat-green' : 'text-wechat-text-gray'} />
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium truncate">{lb.name}</p>
                  <p className="text-small text-wechat-text-light">
                    {lb.entries.length} 条目 · {lb.description || '无描述'}
                  </p>
                </div>
                <button
                  id={`edit-lorebook-${lb.id}`}
                  onClick={() => setEditingId(lb.id)}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="编辑条目"
                >
                  <Edit3 size={14} className="text-wechat-text-gray" />
                </button>
                <button
                  id={`toggle-lorebook-${lb.id}`}
                  onClick={() => toggleActiveLorebook(lb.id)}
                  className={`w-10 h-5 rounded-full transition-colors ${isActive ? 'bg-wechat-green' : 'bg-gray-300'}`}
                >
                  <span
                    className={`block w-4 h-4 bg-white rounded-full transition-transform ml-0.5 ${isActive ? 'translate-x-5' : ''}`}
                  />
                </button>
                <button
                  id={`export-lorebook-${lb.id}`}
                  onClick={() => handleExport(lb.id)}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="导出"
                >
                  <Download size={14} className="text-wechat-text-gray" />
                </button>
                <button
                  id={`delete-lorebook-${lb.id}`}
                  onClick={() => handleDelete(lb.id)}
                  className="p-1.5 hover:bg-red-50 rounded transition-colors"
                  title="删除"
                >
                  <Trash2 size={14} className="text-wechat-danger" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {editingId && (
        <LorebookEditor
          lorebookId={editingId}
          onClose={() => setEditingId(null)}
        />
      )}
    </Modal>
  );
}
