'use client';
export const runtime = 'edge';
import { useState } from 'react';
import { use } from 'react';

export default function CctvRequestPage({ params }: { params: Promise<{ centerId: string }> }) {
  const { centerId } = use(params);
  const [form, setForm] = useState({ requester_name: '', requester_phone: '', requester_relation: '부모', child_name: '', requested_date: '', requested_time_from: '', requested_time_to: '', reason: '' });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/cctv', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, centerId }),
    });
    if (res.ok) setDone(true);
    setLoading(false);
  };

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📩</div>
      <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: '#166534', marginBottom: '0.5rem' }}>신청이 접수되었습니다</h1>
      <p style={{ color: '#64748b' }}>원장님 검토 후 결과를 안내드립니다.</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📹</div>
          <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1e293b' }}>CCTV 열람 신청</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>원장 검토 후 승인 여부를 안내해 드립니다</p>
        </div>

        <form onSubmit={submit} style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>신청인 *</label>
              <input value={form.requester_name} onChange={(e) => setForm({ ...form, requester_name: e.target.value })} required placeholder="이름"
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem', fontSize: '0.9rem', marginTop: '0.25rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>관계</label>
              <select value={form.requester_relation} onChange={(e) => setForm({ ...form, requester_relation: e.target.value })}
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {['부모', '법정대리인', '친족'].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {[
            { label: '연락처 *', key: 'requester_phone', placeholder: '010-0000-0000', type: 'tel' },
            { label: '아이 이름 *', key: 'child_name', placeholder: '예: 김민준', type: 'text' },
            { label: '열람 요청 날짜 *', key: 'requested_date', placeholder: '', type: 'date' },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>{label}</label>
              <input type={type} value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder} required
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem', fontSize: '0.9rem', marginTop: '0.25rem', boxSizing: 'border-box' }} />
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div><label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>시작 시간</label>
              <input type="time" value={form.requested_time_from} onChange={(e) => setForm({ ...form, requested_time_from: e.target.value })}
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem', fontSize: '0.9rem', marginTop: '0.25rem', boxSizing: 'border-box' }} /></div>
            <div><label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>종료 시간</label>
              <input type="time" value={form.requested_time_to} onChange={(e) => setForm({ ...form, requested_time_to: e.target.value })}
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem', fontSize: '0.9rem', marginTop: '0.25rem', boxSizing: 'border-box' }} /></div>
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>열람 사유 *</label>
            <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required rows={3}
              placeholder="열람이 필요한 이유를 간략히 설명해 주세요"
              style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem', fontSize: '0.9rem', marginTop: '0.25rem', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.75rem', padding: '0.85rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem' }}>
            {loading ? '신청 중...' : 'CCTV 열람 신청'}
          </button>
        </form>
      </div>
    </div>
  );
}
