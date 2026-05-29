import { useState, useRef } from 'react';
import { useAppStore } from '../../store/appStore';
import Avatar from '../shared/Avatar';
import Modal from '../shared/Modal';
import ContactDetail from './ContactDetail';
import { Search, Send, Sparkles, UserPlus, X, Loader2 } from 'lucide-react';
import { assemblePrompt } from '../../sillytavern/prompt-assembler';
import type { Contact } from '../../types';

/** Parse AI-generated <list> XML into Contact objects */
function parseCharListXml(xml: string): Partial<Contact>[] {
  const results: Partial<Contact>[] = [];
  const charRegex = /<char>([\s\S]*?)<\/char>/gi;
  let m;
  while ((m = charRegex.exec(xml)) !== null) {
    const block = m[1];
    const get = (tag: string) => {
      const r = new RegExp(`<${tag}>([\\s\\S]*?)<\/${tag}>`, 'i');
      const match = block.match(r);
      return match ? match[1].trim() : '';
    };
    results.push({
      name: get('name'),
      education: get('education'),
      occupation: get('occupation'),
      region: get('region'),
      source: get('source') || 'AI生成',
      bio: get('bio'),
      avatar: get('avatar') || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    });
  }
  return results;
}

export default function ContactList() {
  const contacts = useAppStore(s => s.contacts);
  const settings = useAppStore(s => s.settings);
  const presets = useAppStore(s => s.presets);
  const activePresetId = useAppStore(s => s.activePresetId);
  const lorebooks = useAppStore(s => s.lorebooks);
  const activeLorebookIds = useAppStore(s => s.activeLorebookIds);
  const addContact = useAppStore(s => s.addContact);
  const showToast = useAppStore(s => s.showToast);

  const [search, setSearch] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<Partial<Contact>[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selected = selectedId ? contacts.find(c => c.id === selectedId) ?? null : null;

  const filtered = search ? contacts.filter(c => c.name.includes(search)) : contacts;

  const grouped: Record<string, typeof contacts> = {};
  filtered.forEach(c => {
    const letter = c.name[0];
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(c);
  });

  const handleAiSearch = async () => {
    const query = search.trim();
    if (!query || aiGenerating) return;

    const hasApiKey = settings.api.apiKey && settings.api.apiKey.trim().length > 0;
    if (!hasApiKey) {
      showToast('请先在 API 设置中配置 API Key');
      return;
    }

    setAiGenerating(true);
    setAiResult(null);

    try {
      const activePreset = presets.find(p => p.id === activePresetId) || presets[0];
      if (!activePreset) return;

      const activeBooks = lorebooks.filter(lb => activeLorebookIds.includes(lb.id));

      // Build prompt asking AI to generate characters
      const prompt = `[搜索女性] 请根据以下需求生成角色信息。使用 <list> 标签包裹输出：\n\n${query}`;

      const { messages: promptMessages } = assemblePrompt({
        userInput: prompt,
        history: [],
        preset: activePreset,
        lorebooks: activeBooks,
        userName: settings.userName || '用户',
        characterName: settings.characterName || 'AI',
        variables: {},
        formatPrompt: settings.formatPromptTemplate || '',
      });

      const url = settings.api.baseUrl.replace(/\/+$/, '') + '/chat/completions';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.api.apiKey}` },
        body: JSON.stringify({
          model: settings.api.model || 'gpt-3.5-turbo',
          messages: promptMessages,
          stream: false,
          temperature: 0.8,
          max_tokens: 2048,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`API ${res.status}: ${errText.slice(0, 200)}`);
      }

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || '';

      // Extract <list> content
      const listMatch = raw.match(/<list>([\s\S]*?)<\/list>/i);
      const listXml = listMatch ? listMatch[0] : raw;

      const parsed = parseCharListXml(listXml);
      if (parsed.length === 0) {
        showToast('AI 未生成有效角色，请尝试更具体的描述');
      } else {
        setAiResult(parsed);
      }
    } catch (err: any) {
      showToast(`生成失败: ${err.message?.slice(0, 60)}`);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAddAiContact = (partial: Partial<Contact>) => {
    if (!partial.name) return;
    const now = new Date();
    const id = `c${Date.now()}`;
    const addedTime = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
    const contact: Contact = {
      id,
      name: partial.name || '未命名',
      avatar: partial.avatar || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      avatarType: 'gradient',
      bio: partial.bio || '',
      education: partial.education || '未知',
      occupation: partial.occupation || '未知',
      region: partial.region || '未知',
      source: partial.source || 'AI生成',
      addedTime,
      online: false,
      pinned: false,
      unreadCount: 0,
      muted: false,
    };
    addContact(contact);
    showToast(`已添加联系人: ${contact.name}`);
    // Remove from AI results
    setAiResult(prev => prev ? prev.filter(p => p.name !== partial.name) : null);
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      <div className="px-4 pt-8 pb-3">
        <h1 className="text-title">通讯录</h1>
      </div>

      {/* Search bar with AI generation hint */}
      <div className="px-3 pb-2 space-y-2">
        <div className="flex items-center gap-2 bg-wechat-bg rounded-md px-3 py-1.5">
          <Search size={14} className="text-wechat-text-light flex-shrink-0" />
          <input
            ref={searchInputRef}
            id="contact-search"
            type="text"
            placeholder="搜索或描述想要的AI角色..."
            value={search}
            onChange={e => { setSearch(e.target.value); setAiResult(null); }}
            onKeyDown={e => { if (e.key === 'Enter') handleAiSearch(); }}
            className="bg-transparent text-body outline-none w-full"
          />
          {search.trim() && (
            <button
              onClick={handleAiSearch}
              disabled={aiGenerating}
              className="flex-shrink-0 p-1.5 rounded-full bg-wechat-green text-white hover:bg-wechat-green-dark transition-colors disabled:opacity-50"
              title="AI生成角色"
            >
              {aiGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            </button>
          )}
        </div>

        {/* AI generation results */}
        {aiGenerating && (
          <div className="flex items-center gap-2 px-2 py-2 text-[13px] text-wechat-text-gray">
            <Loader2 size={14} className="animate-spin text-wechat-green" />
            <span>AI 正在生成角色信息...</span>
          </div>
        )}

        {aiResult && aiResult.length > 0 && (
          <div className="bg-wechat-green-light rounded-lg p-3 space-y-2 animate-scaleIn">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-wechat-green flex items-center gap-1.5">
                <Sparkles size={12} /> AI 生成的 {aiResult.length} 个角色
              </span>
              <button onClick={() => setAiResult(null)} className="text-wechat-text-light/60 hover:text-wechat-danger">
                <X size={14} />
              </button>
            </div>
            {aiResult.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-wechat-green/20">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                  style={{ background: c.avatar || 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                  {(c.name || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium">{c.name}</p>
                  <p className="text-[11px] text-wechat-text-gray truncate">
                    {[c.occupation, c.education, c.region, c.source].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button
                  onClick={() => handleAddAiContact(c)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-wechat-green text-white text-[12px] font-medium hover:bg-wechat-green-dark transition-colors flex-shrink-0"
                >
                  <UserPlus size={12} /> 添加
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact A-Z list */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(grouped).map(([letter, items]) => (
          <div key={letter}>
            <div className="px-4 py-1.5 bg-wechat-bg text-small text-wechat-text-gray font-medium">{letter}</div>
            {items.map(c => (
              <div key={c.id} id={`contact-${c.id}`}
                onClick={() => setSelectedId(c.id)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-wechat-bg cursor-pointer transition-colors border-b border-wechat-divider last:border-0">
                <Avatar gradient={c.avatar} name={c.name} size="lg" src={c.avatarType === 'image' ? c.avatarImage : undefined} />
                <div className="flex-1">
                  <p className="text-body">{c.name}</p>
                  {c.tags && <p className="text-small text-wechat-text-gray">{c.tags.join(' · ')}</p>}
                </div>
              </div>
            ))}
          </div>
        ))}
        {Object.keys(grouped).length === 0 && !aiGenerating && (
          <div className="flex flex-col items-center justify-center py-16 text-wechat-text-light/50">
            <UserPlus size={40} className="mb-3" />
            <p className="text-[14px]">暂无联系人</p>
            <p className="text-[12px] mt-1">使用上方搜索框描述想要的AI角色</p>
          </div>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelectedId(null)} title="联系人详情">
        {selected && <ContactDetail contact={selected} onClose={() => setSelectedId(null)} />}
      </Modal>
    </div>
  );
}
