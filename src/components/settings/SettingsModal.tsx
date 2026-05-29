import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import Modal from '../shared/Modal';
import type { AppSettings } from '../../sillytavern/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

function ensureSecondary(secondary: AppSettings['api']['secondary']): NonNullable<AppSettings['api']['secondary']> {
  return {
    enabled: secondary?.enabled ?? false,
    baseUrl: secondary?.baseUrl ?? '',
    apiKey: secondary?.apiKey ?? '',
    model: secondary?.model ?? '',
    temperature: secondary?.temperature,
    maxTokens: secondary?.maxTokens,
  };
}

export default function SettingsModal({ open, onClose }: Props) {
  const settings = useAppStore(s => s.settings);
  const updateSettings = useAppStore(s => s.updateSettings);
  const [form, setForm] = useState({ ...settings, api: { ...settings.api, secondary: ensureSecondary(settings.api.secondary) } });

  useEffect(() => {
    if (open) setForm({ ...settings, api: { ...settings.api, secondary: ensureSecondary(settings.api.secondary) } });
  }, [open, settings]);

  const handleSave = () => {
    updateSettings(form);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="API 设置" size="lg">
      <div className="space-y-4">
        <h3 className="text-body font-semibold text-wechat-text">主 API</h3>
        <div>
          <label className="text-small text-wechat-text-gray">Base URL</label>
          <input
            id="api-base-url"
            type="text"
            value={form.api.baseUrl}
            onChange={e => setForm({ ...form, api: { ...form.api, baseUrl: e.target.value } })}
            className="w-full mt-1 px-3 py-2 bg-wechat-bg rounded-md text-body outline-none focus:ring-1 focus:ring-wechat-green"
          />
        </div>
        <div>
          <label className="text-small text-wechat-text-gray">API Key</label>
          <input
            id="api-key"
            type="password"
            value={form.api.apiKey}
            onChange={e => setForm({ ...form, api: { ...form.api, apiKey: e.target.value } })}
            placeholder="sk-..."
            className="w-full mt-1 px-3 py-2 bg-wechat-bg rounded-md text-body outline-none focus:ring-1 focus:ring-wechat-green"
          />
        </div>
        <div>
          <label className="text-small text-wechat-text-gray">Model</label>
          <input
            id="api-model"
            type="text"
            value={form.api.model}
            onChange={e => setForm({ ...form, api: { ...form.api, model: e.target.value } })}
            className="w-full mt-1 px-3 py-2 bg-wechat-bg rounded-md text-body outline-none focus:ring-1 focus:ring-wechat-green"
          />
        </div>
        <div>
          <label className="text-small text-wechat-text-gray">超时 (ms)</label>
          <input
            id="api-timeout"
            type="number"
            value={form.api.timeout}
            onChange={e => setForm({ ...form, api: { ...form.api, timeout: Number(e.target.value) } })}
            className="w-full mt-1 px-3 py-2 bg-wechat-bg rounded-md text-body outline-none focus:ring-1 focus:ring-wechat-green"
          />
        </div>

        <div className="border-t border-wechat-divider pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-body font-semibold text-wechat-text">次 API (变量/总结分流)</h3>
            <button
              id="toggle-secondary-api"
              onClick={() =>
                setForm({
                  ...form,
                  api: {
                    ...form.api,
                    secondary: {
                      ...form.api.secondary,
                      enabled: !form.api.secondary?.enabled,
                    },
                  },
                })
              }
              className={`w-10 h-5 rounded-full transition-colors ${form.api.secondary?.enabled ? 'bg-wechat-green' : 'bg-gray-300'}`}
            >
              <span
                className={`block w-4 h-4 bg-white rounded-full transition-transform ml-0.5 ${form.api.secondary?.enabled ? 'translate-x-5' : ''}`}
              />
            </button>
          </div>
          {form.api.secondary?.enabled && (
            <div className="space-y-3 mt-3">
              <div>
                <label className="text-small text-wechat-text-gray">Base URL</label>
                <input
                  id="sec-api-url"
                  type="text"
                  value={form.api.secondary.baseUrl}
                  onChange={e => setForm({ ...form, api: { ...form.api, secondary: { ...form.api.secondary, baseUrl: e.target.value } } })}
                  className="w-full mt-1 px-3 py-2 bg-wechat-bg rounded-md text-body outline-none focus:ring-1 focus:ring-wechat-green"
                />
              </div>
              <div>
                <label className="text-small text-wechat-text-gray">API Key</label>
                <input
                  id="sec-api-key"
                  type="password"
                  value={form.api.secondary.apiKey}
                  onChange={e => setForm({ ...form, api: { ...form.api, secondary: { ...form.api.secondary, apiKey: e.target.value } } })}
                  className="w-full mt-1 px-3 py-2 bg-wechat-bg rounded-md text-body outline-none focus:ring-1 focus:ring-wechat-green"
                />
              </div>
              <div>
                <label className="text-small text-wechat-text-gray">Model</label>
                <input
                  id="sec-api-model"
                  type="text"
                  value={form.api.secondary.model}
                  onChange={e => setForm({ ...form, api: { ...form.api, secondary: { ...form.api.secondary, model: e.target.value } } })}
                  className="w-full mt-1 px-3 py-2 bg-wechat-bg rounded-md text-body outline-none focus:ring-1 focus:ring-wechat-green"
                />
              </div>
            </div>
          )}
        </div>

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
