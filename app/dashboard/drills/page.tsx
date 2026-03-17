'use client';
import { useState, useEffect, useCallback } from 'react';
import AppNav from '../../../components/AppNav';
import { useAI } from '../../../lib/useAI';
import ModelSelector from '../../../components/ModelSelector';

interface DrillRec { id: string; drill_type: string; drill_date: string; start_time?: string; end_time?: string; participant_count?: number; evacuation_time_seconds?: number; scenario?: string; supervisor_name?: string; }
interface Compliance { fire: number; earthquake: number; evacuation: number; fire_required: number; earthquake_required: number; evacuation_required: number; fire_ok: boolean; earthquake_ok: boolean; evacuation_ok: boolean; all_ok: boolean; }

const TYPE_LABELS: Record<string, string> = { fire: '🔥 화재', earthquake: '🌍 지진', evacuation: '🚪 대피', lockdown: '🔒 잠금' };

export default function DrillsPage() {
  const year = new Date().getFullYear();
  const [records, setRecords] = useState<DrillRec[]>([]);
  const [compliance, setCompliance] = useState<Compliance | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ drill_type: 'fire', drill_date: new Date().toISOString().split('T')[0], start_time: '', end_time: '', participant_count: '', evacuation_time_seconds: '', scenario: '', supervisor_name: '' });
  const [msg, setMsg] = useState('');
  const { output, loading: aiLoading, generate, model, setModel } = useAI();

  const load = useCallback(async () => {
    const res = await fetch(`/api/drills?year=${year}`);
    if (res.ok) {
      const d = await res.json() as { records: DrillRec[]; compliance: Compliance };
      setRecords(d.records); setCompliance(d.compliance);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/drills', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, participant_count: Number(form.participant_count) || null, evacuation_time_seconds: Number(form.evacuation_time_seconds) || null }),
    });
    if (res.ok) { setMsg('훈련 기록 추가됨'); setShowForm(false); load(); setTimeout(() => setMsg(''), 2000); }
  };

  const del = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await fetch(`/api/drills?id=${id}`, { method: 'DELETE' });
    load();
  };

  const genPlan = () => {
    generate(`어린이집 ${form.drill_type === 'fire' ? '화재' : form.drill_type === 'earthquake' ? '지진' : '대피'} 훈련 계획서를 작성해주세요.\n\n[지침]\n- 훈련 목적, 일시, 대상, 훈련 시나리오, 역할 분담, 행동 절차, 사후 평가 항목 포함\n- 영유아보육법 기준 준수\n- 완성된 계획서만 출력`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🚒</span>
            <h1 style={{ fontWeight: 900, fontSize: '1.4rem', color: '#1e293b', margin: 0 }}>재난·소방 훈련 기록</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            style={{ background: '#0d9488', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 700 }}>
            + 훈련 기록 추가
          </button>
        </div>

        {/* 법정 준수 현황 */}
        {compliance && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: '화재 훈련', count: compliance.fire, required: compliance.fire_required, ok: compliance.fire_ok },
              { label: '지진 훈련', count: compliance.earthquake, required: compliance.earthquake_required, ok: compliance.earthquake_ok },
              { label: '대피 훈련', count: compliance.evacuation, required: compliance.evacuation_required, ok: compliance.evacuation_ok },
            ].map((c) => (
              <div key={c.label} style={{ background: c.ok ? '#dcfce7' : '#fee2e2', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.label}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: c.ok ? '#166534' : '#991b1b' }}>{c.count}/{c.required}</div>
                <div style={{ fontSize: '0.8rem', color: c.ok ? '#166534' : '#991b1b' }}>{c.ok ? '✅ 충족' : '⚠️ 미충족'}</div>
              </div>
            ))}
          </div>
        )}

        {msg && <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: 600 }}>{msg}</div>}

        {/* 입력 폼 */}
        {showForm && (
          <form onSubmit={submit} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, margin: '0 0 1rem' }}>훈련 기록 입력</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div><label style={{ fontSize: '0.85rem', color: '#475569' }}>훈련 유형</label>
                <select value={form.drill_type} onChange={(e) => setForm({ ...form, drill_type: e.target.value })}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.4rem' }}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select></div>
              <div><label style={{ fontSize: '0.85rem', color: '#475569' }}>훈련 날짜</label>
                <input type="date" value={form.drill_date} onChange={(e) => setForm({ ...form, drill_date: e.target.value })}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.4rem' }} required /></div>
              <div><label style={{ fontSize: '0.85rem', color: '#475569' }}>참가 인원</label>
                <input type="number" value={form.participant_count} onChange={(e) => setForm({ ...form, participant_count: e.target.value })}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.4rem' }} /></div>
              <div><label style={{ fontSize: '0.85rem', color: '#475569' }}>대피 소요 시간(초)</label>
                <input type="number" value={form.evacuation_time_seconds} onChange={(e) => setForm({ ...form, evacuation_time_seconds: e.target.value })}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.4rem' }} /></div>
              <div><label style={{ fontSize: '0.85rem', color: '#475569' }}>감독자</label>
                <input value={form.supervisor_name} onChange={(e) => setForm({ ...form, supervisor_name: e.target.value })}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.4rem' }} /></div>
            </div>
            <div style={{ marginBottom: '0.75rem' }}><label style={{ fontSize: '0.85rem', color: '#475569' }}>훈련 시나리오</label>
              <textarea value={form.scenario} onChange={(e) => setForm({ ...form, scenario: e.target.value })} rows={2}
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.4rem', boxSizing: 'border-box' }} /></div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" style={{ background: '#0d9488', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 700 }}>저장</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>취소</button>
            </div>
          </form>
        )}

        {/* AI 계획서 */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>AI 훈련 계획서 생성</span>
            <ModelSelector value={model} onChange={setModel} />
          </div>
          <button onClick={genPlan} disabled={aiLoading}
            style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 700 }}>
            {aiLoading ? '생성 중...' : '🤖 AI 계획서 생성'}
          </button>
          {output && <div style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.88rem', lineHeight: 1.7, color: '#1e293b' }}>{output}</div>}
        </div>

        {/* 기록 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {records.map((r) => (
            <div key={r.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 700 }}>{TYPE_LABELS[r.drill_type]}</span>
                <span style={{ color: '#64748b', marginLeft: '0.75rem', fontSize: '0.9rem' }}>{r.drill_date}</span>
                {r.participant_count && <span style={{ color: '#64748b', marginLeft: '0.5rem', fontSize: '0.85rem' }}>참가 {r.participant_count}명</span>}
                {r.evacuation_time_seconds && <span style={{ color: '#22c55e', marginLeft: '0.5rem', fontSize: '0.85rem' }}>{r.evacuation_time_seconds}초 대피</span>}
                {r.supervisor_name && <span style={{ color: '#94a3b8', marginLeft: '0.5rem', fontSize: '0.82rem' }}>{r.supervisor_name}</span>}
              </div>
              <button onClick={() => del(r.id)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '0.4rem', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>삭제</button>
            </div>
          ))}
          {records.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>올해 훈련 기록이 없습니다</div>}
        </div>
      </main>
    </div>
  );
}
