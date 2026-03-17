'use client';
import { useState, useEffect, useCallback } from 'react';
import AppNav from '../../../components/AppNav';
import { useAI } from '../../../lib/useAI';
import ModelSelector from '../../../components/ModelSelector';

interface Item { id: string; category_id: string; indicator_code: string; description: string; status: string; notes?: string; }
interface Category { id: string; label: string; sort_order: number; items: Item[]; }
interface Stats { total: number; not_started: number; in_progress: number; ready: number; submitted: number; }

const STATUS_OPTS = [
  { value: 'not_started', label: '미착수', color: '#fee2e2' },
  { value: 'in_progress', label: '진행중', color: '#fef3c7' },
  { value: 'ready', label: '준비완료', color: '#dcfce7' },
  { value: 'submitted', label: '제출완료', color: '#dbeafe' },
];

export default function AccreditationPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [changes, setChanges] = useState<Record<string, { status: string; notes: string }>>({});
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [msg, setMsg] = useState('');
  const { output, loading: aiLoading, generate, model, setModel } = useAI();

  const load = useCallback(async () => {
    const res = await fetch('/api/accreditation');
    if (res.ok) {
      const d = await res.json() as { categories: Category[]; stats: Stats };
      setCategories(d.categories); setStats(d.stats);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const init = async () => {
    setInitializing(true);
    const res = await fetch('/api/accreditation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (res.ok) { setMsg('평가 지표 초기화 완료 (22개 지표)'); load(); }
    else { const e = await res.json() as { error: string }; setMsg(e.error); }
    setInitializing(false); setTimeout(() => setMsg(''), 3000);
  };

  const changeItem = (id: string, field: 'status' | 'notes', value: string) => {
    setChanges((prev) => ({ ...prev, [id]: { status: prev[id]?.status ?? '', notes: prev[id]?.notes ?? '', [field]: value } }));
  };

  const save = async () => {
    setSaving(true);
    const items = Object.entries(changes).map(([id, c]) => ({ id, status: c.status, notes: c.notes })).filter((i) => i.status);
    if (items.length === 0) { setSaving(false); return; }
    const res = await fetch('/api/accreditation', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
    if (res.ok) { setMsg(`${items.length}개 항목 저장됨`); setChanges({}); load(); }
    setSaving(false); setTimeout(() => setMsg(''), 2000);
  };

  const analyzeGaps = () => {
    const notDone = categories.flatMap((c) => c.items.filter((i) => i.status === 'not_started' || i.status === 'in_progress').map((i) => `[${i.indicator_code}] ${i.description}`));
    if (notDone.length === 0) { setMsg('모든 지표가 준비완료 상태입니다 🎉'); return; }
    generate(`어린이집 평가인증 준비 현황입니다.\n\n[미완료/진행중 지표]\n${notDone.slice(0, 15).join('\n')}\n\n[요청]\n각 지표별로 구체적인 준비 방법과 필요 서류를 알려주세요. 우선순위 순으로 정리해주세요.`);
  };

  const pct = stats ? Math.round(((stats.ready + stats.submitted) / stats.total) * 100) || 0 : 0;

  const getStatus = (item: Item) => changes[item.id]?.status || item.status;
  const getNotes = (item: Item) => changes[item.id]?.notes ?? (item.notes || '');

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🏅</span>
            <h1 style={{ fontWeight: 900, fontSize: '1.4rem', color: '#1e293b', margin: 0 }}>평가인증 준비 도우미</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {categories.length === 0 && (
              <button onClick={init} disabled={initializing}
                style={{ background: '#0d9488', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700 }}>
                {initializing ? '초기화 중...' : '🚀 지표 초기화 (22개)'}
              </button>
            )}
            {Object.keys(changes).length > 0 && (
              <button onClick={save} disabled={saving}
                style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700 }}>
                {saving ? '저장 중...' : `💾 변경 저장 (${Object.keys(changes).length}건)`}
              </button>
            )}
          </div>
        </div>

        {/* 진행률 */}
        {stats && (
          <div style={{ background: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700 }}>전체 진행률</span>
              <span style={{ fontWeight: 900, color: '#0d9488' }}>{pct}%</span>
            </div>
            <div style={{ background: '#f1f5f9', borderRadius: '1rem', height: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ background: '#0d9488', height: '100%', width: `${pct}%`, borderRadius: '1rem', transition: 'width 0.3s' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {STATUS_OPTS.map((s) => (
                <span key={s.value} style={{ background: s.color, padding: '0.2rem 0.7rem', borderRadius: '1rem', fontSize: '0.82rem', fontWeight: 600 }}>
                  {s.label} {stats[s.value as keyof Stats]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI 분석 */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>AI 부족 항목 분석</span>
            <ModelSelector value={model} onChange={setModel} />
          </div>
          <button onClick={analyzeGaps} disabled={aiLoading}
            style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 700 }}>
            {aiLoading ? '분석 중...' : '🤖 미완료 항목 분석'}
          </button>
          {output && <div style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.88rem', lineHeight: 1.7, color: '#1e293b', maxHeight: '300px', overflowY: 'auto' }}>{output}</div>}
        </div>

        {msg && <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: 600 }}>{msg}</div>}

        {/* 체크리스트 */}
        {categories.map((cat) => (
          <div key={cat.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginBottom: '0.75rem' }}>
              {cat.label}
              <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                ({cat.items.filter((i) => getStatus(i) === 'ready' || getStatus(i) === 'submitted').length}/{cat.items.length} 완료)
              </span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {cat.items.map((item) => {
                const st = getStatus(item);
                const stOpt = STATUS_OPTS.find((s) => s.value === st);
                return (
                  <div key={item.id} style={{ border: '1px solid #f1f5f9', borderRadius: '0.5rem', padding: '0.75rem', background: stOpt?.color || '#f8fafc', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>{item.indicator_code}</span>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ fontSize: '0.88rem', color: '#1e293b', marginBottom: '0.3rem' }}>{item.description}</div>
                      <input placeholder="메모 (근거 서류, 파일 위치 등)" value={getNotes(item)}
                        onChange={(e) => changeItem(item.id, 'notes', e.target.value)}
                        style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.35rem', padding: '0.3rem 0.5rem', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                    </div>
                    <select value={st} onChange={(e) => changeItem(item.id, 'status', e.target.value)}
                      style={{ border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.3rem', fontSize: '0.82rem', background: stOpt?.color || 'white' }}>
                      {STATUS_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
            평가 지표를 초기화하면 어린이집 평가 체크리스트가 생성됩니다
          </div>
        )}
      </main>
    </div>
  );
}
