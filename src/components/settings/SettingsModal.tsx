import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import Modal from '../shared/Modal';
import { CheckCircle, AlertCircle, Loader2, Download, Zap, ChevronDown } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

interface ProviderPreset {
  name: string; baseUrl: string; models: string[];
}

const PROVIDERS: ProviderPreset[] = [
  { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: ['gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
  { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { name: 'Kimi (Moonshot)', baseUrl: 'https://api.moonshot.cn/v1', models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'] },
  { name: 'Ollama (本地)', baseUrl: 'http://localhost:11434/v1', models: [] },
  { name: 'Custom', baseUrl: '', models: [] },
];

export default function SettingsModal({ open, onClose }: Props) {
  const settings = useAppStore(s => s.settings);
  const updateSettings = useAppStore(s => s.updateSettings);
  const showToast = useAppStore(s => s.showToast);

  const [baseUrl, setBaseUrl] = useState(settings.api.baseUrl);
  const [apiKey, setApiKey] = useState(settings.api.apiKey);
  const [model, setModel] = useState(settings.api.model);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'fail'>('idle');
  const [testMsg, setTestMsg] = useState('');
  const [fetchingModels, setFetchingModels] = useState(false);

  // Sync form when modal opens
  useEffect(() => {
    if (!open) return;
    setBaseUrl(settings.api.baseUrl);
    setApiKey(settings.api.apiKey);
    setModel(settings.api.model);
    setTestResult('idle');
    setTestMsg('');
    setFetchedModels([]);
    // Detect provider
    const match = PROVIDERS.find(p => p.baseUrl && settings.api.baseUrl.startsWith(p.baseUrl));
    setSelectedProvider(match?.name || 'Custom');
  }, [open, settings]);

  // All available models: provider defaults + fetched
  const allModels = [...new Set([...getProviderModels(), ...fetchedModels])];

  function getProviderModels(): string[] {
    const p = PROVIDERS.find(pr => pr.name === selectedProvider);
    return p?.models || [];
  }

  const selectProvider = (name: string) => {
    setSelectedProvider(name);
    const p = PROVIDERS.find(pr => pr.name === name);
    if (p && p.baseUrl) {
      setBaseUrl(p.baseUrl);
      if (p.models.length > 0 && !model) setModel(p.models[0]);
    }
  };

  const handleFetchModels = async () => {
    if (!baseUrl || !apiKey) {
      showToast('请先填写 Base URL 和 API Key');
      return;
    }
    setFetchingModels(true);
    try {
      const url = baseUrl.replace(/\/+$/, '') + '/models';
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}` } });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const ids = (data.data || []).map((m: any) => m.id).filter(Boolean).sort();
      setFetchedModels(ids as string[]);
      showToast(`获取到 ${ids.length} 个模型`);
    } catch (e: any) {
      showToast('获取模型列表失败: ' + (e.message || '网络错误'));
    } finally {
      setFetchingModels(false);
    }
  };

  const handleTestConnection = async () => {
    if (!baseUrl || !apiKey) {
      showToast('请先填写 Base URL 和 API Key');
      return;
    }
    setTesting(true);
    setTestResult('idle');
    try {
      const url = baseUrl.replace(/\/+$/, '') + '/models';
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}` } });
      if (res.ok) {
        const data = await res.json();
        setTestResult('success');
        setTestMsg(`连接成功 — ${(data.data || []).length || '?'} 个模型可用`);
      } else {
        const err = await res.text().catch(() => '');
        setTestResult('fail');
        setTestMsg(`HTTP ${res.status}: ${err.slice(0, 100)}`);
      }
    } catch (e: any) {
      setTestResult('fail');
      setTestMsg(e.message || '网络连接失败');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    updateSettings({
      ...settings,
      api: { ...settings.api, baseUrl, apiKey, model, timeout: settings.api.timeout },
    });
    showToast('API 设置已保存');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="API 设置" size="lg">
      <div className="space-y-4">
        {/* Provider quick select */}
        <div>
          <label className="text-small text-wechat-text-gray mb-2 block">服务提供商</label>
          <div className="flex flex-wrap gap-2">
            {PROVIDERS.map(p => (
              <button
                key={p.name}
                id={`provider-${p.name}`}
                onClick={() => selectProvider(p.name)}
                className={`px-3 py-1.5 rounded-full text-small font-medium transition-all ${
                  selectedProvider === p.name
                    ? 'bg-wechat-green text-white'
                    : 'bg-wechat-bg text-wechat-text-gray hover:bg-gray-200'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Base URL */}
        <div>
          <label className="text-small text-wechat-text-gray">Base URL</label>
          <input
            id="api-base-url"
            type="text"
            value={baseUrl}
            onChange={e => { setBaseUrl(e.target.value); setSelectedProvider('Custom'); }}
            placeholder="https://api.openai.com/v1"
            className="w-full mt-1 px-3 py-2 bg-wechat-bg rounded-md text-body outline-none focus:ring-1 focus:ring-wechat-green font-mono text-small"
          />
        </div>

        {/* API Key */}
        <div>
          <label className="text-small text-wechat-text-gray">API Key</label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full mt-1 px-3 py-2 bg-wechat-bg rounded-md text-body outline-none focus:ring-1 focus:ring-wechat-green font-mono text-small"
          />
        </div>

        {/* Model selection with dropdown and fetch */}
        <div>
          <label className="text-small text-wechat-text-gray">Model</label>
          <div className="flex gap-2 mt-1">
            <div className="relative flex-1">
              <input
                id="api-model"
                type="text"
                value={model}
                onChange={e => { setModel(e.target.value); setShowModelDropdown(true); }}
                onFocus={() => setShowModelDropdown(true)}
                onBlur={() => setTimeout(() => setShowModelDropdown(false), 150)}
                placeholder="gpt-4o"
                className="w-full px-3 py-2 bg-wechat-bg rounded-md text-body outline-none focus:ring-1 focus:ring-wechat-green"
              />
              {showModelDropdown && allModels.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-wechat-divider rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                  {allModels.filter(m => m.includes(model) || !model).map(m => (
                    <button
                      key={m}
                      id={`model-opt-${m}`}
                      onMouseDown={() => { setModel(m); setShowModelDropdown(false); }}
                      className={`w-full text-left px-3 py-2 text-body hover:bg-wechat-green-light transition-colors ${m === model ? 'text-wechat-green font-medium' : ''}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              id="fetch-models-btn"
              onClick={handleFetchModels}
              disabled={fetchingModels}
              className="px-3 py-2 bg-wechat-bg hover:bg-gray-200 rounded-md text-small text-wechat-text-gray transition-colors flex items-center gap-1 flex-shrink-0"
              title="从 API 获取模型列表"
            >
              {fetchingModels ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              获取
            </button>
          </div>
        </div>

        {/* Test connection */}
        <div className="flex items-center gap-3">
          <button
            id="test-connection-btn"
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-1.5 px-4 py-2 bg-wechat-bg hover:bg-gray-200 rounded-md text-body transition-colors disabled:opacity-50"
          >
            {testing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            测试连接
          </button>
          {testResult === 'success' && (
            <span className="text-small text-wechat-green flex items-center gap-1">
              <CheckCircle size={14} /> {testMsg}
            </span>
          )}
          {testResult === 'fail' && (
            <span className="text-small text-wechat-danger flex items-center gap-1">
              <AlertCircle size={14} /> {testMsg}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-wechat-divider pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-body font-semibold text-wechat-text">次 API (可选)</h3>
            <button
              id="toggle-secondary-api"
              onClick={() => {
                const sec = settings.api.secondary;
                updateSettings({
                  ...settings,
                  api: {
                    ...settings.api,
                    secondary: {
                      enabled: !sec?.enabled,
                      baseUrl: sec?.baseUrl || '',
                      apiKey: sec?.apiKey || '',
                      model: sec?.model || '',
                    },
                  },
                });
              }}
              className={`w-10 h-5 rounded-full transition-colors ${settings.api.secondary?.enabled ? 'bg-wechat-green' : 'bg-gray-300'}`}
            >
              <span className={`block w-4 h-4 bg-white rounded-full transition-transform ml-0.5 ${settings.api.secondary?.enabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          {settings.api.secondary?.enabled && (
            <p className="text-small text-wechat-text-gray mt-2">
              次 API 用于处理变量更新和总结任务，可使用更便宜的模型。配置方式与主 API 相同，请在「我 → 预设管理」中调整。
            </p>
          )}
        </div>

        {/* Save */}
        <button
          id="save-settings-btn"
          onClick={handleSave}
          className="w-full py-2.5 bg-wechat-green text-white rounded-md font-medium hover:bg-wechat-green-dark transition-colors active:scale-[0.98]"
        >
          保存设置
        </button>
      </div>
    </Modal>
  );
}
