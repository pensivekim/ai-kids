'use client';
import { useState, useEffect, useCallback } from 'react';
import AppNav from '../../../components/AppNav';

interface CctvReq { id: string; requester_name: string; requester_phone: string; requester_relation: string; child_name: string; requested_date: string; requested_time_from?: string; requested_time_to?: string; reason: string; status: string; review_note?: string; view_deadline?: string; created_at: string; }

export default function CctvPage() {
  const [requests, setRequests] = useState<CctvReq[]>([]);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState<CctvReq | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [deadlineDays, setDeadlineDays] = useState('7');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/cctv?status=${filter}`);
    if (res.ok) setRequests(await res.json() as CctvReq[]);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const review = async (status: string) => {
    if (!selected) return;
    const res = await fetch('/api/cctv', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, status, reviewNote, viewDeadlineDays: Number(deadlineDays) }),
    });
    if (res.ok) {
      const d = await res.json() as { view_deadline?: string };
      setMsg(status === 'approved' ? `승인 완료 · 열람기한: ${d.view_deadline?.slice(0,10)}` : '거절 처리됨');
      setSelected(null); setReviewNote(''); load();
    }
    setTimeout(() => setMsg(''), 4000);
  };

  const statusColor = (s: string) => ({ pending: '#fef3c7', approved: '#dcfce7', denied: '#fee2e2', viewed: '#eff6ff', expired: '#f1f5f9' }[s] || '#f1f5f9');
  const statusLabel = (s: string) => ({ pending: '검토중', approved: '승인', denied: '거절', viewed: '열람완료', expired: '기한만료' }[s] || s);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.6rem' }}>📹</span>
          <h1 style={{ fontWeight: 900, fontSize: '1.4rem', color: '#1e293b', margin: 0 }}>CCTV 열람 요청</h1>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {['pending', 'approved', 'denied', 'viewed', 'expired'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ background: filter === s ? '#1e293b' : '#f1f5f9', color: filter === s ? 'white' : '#374151', border: 'none', borderRadius: '2rem', padding: '0.4rem 0.9rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              {statusLabel(s)}
            </button>
          ))}
        </div>

        {msg && <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: 600 }}>{msg}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {requests.map((r) => (
            <div key={r.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700 }}>{r.requester_name}</span>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>({r.requester_relation})</span>
                    <span style={{ background: statusColor(r.status), padding: '0.15rem 0.55rem', borderRadius: '1rem', fontSize: '0.78rem', fontWeight: 600 }}>{statusLabel(r.status)}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.8 }}>
                    <div>아동: <strong>{r.child_name}</strong></div>
                    <div>요청 날짜: {r.requested_date} {r.requested_time_from && `${r.requested_time_from} ~ ${r.requested_time_to}`}</div>
                    <div>사유: {r.reason}</div>
                    {r.view_deadline && <div style={{ color: '#22c55e' }}>열람 기한: {r.view_deadline.slice(0, 10)}</div>}
                    {r.review_note && <div style={{ color: '#6366f1' }}>검토 의견: {r.review_note}</div>}
                  </div>
                </div>
                {r.status === 'pending' && (
                  <button onClick={() => { setSelected(r); setReviewNote(''); }}
                    style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    검토하기
                  </button>
                )}
              </div>
            </div>
          ))}
          {requests.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>해당 상태의 요청이 없습니다</div>}
        </div>

        {/* 검토 모달 */}
        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', maxWidth: '460px', width: '90%' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>CCTV 열람 요청 검토</h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem' }}>
                {selected.requester_name} · {selected.child_name} · {selected.requested_date}
              </p>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>검토 의견 (선택)</label>
                <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} rows={3}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.5rem', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>열람 기한 (승인 시, 일)</label>
                <input type="number" value={deadlineDays} onChange={(e) => setDeadlineDays(e.target.value)} min="1" max="30"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.4rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setSelected(null)} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.6rem', cursor: 'pointer', fontWeight: 600 }}>취소</button>
                <button onClick={() => review('denied')} style={{ flex: 1, background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '0.5rem', padding: '0.6rem', cursor: 'pointer', fontWeight: 700 }}>거절</button>
                <button onClick={() => review('approved')} style={{ flex: 2, background: '#22c55e', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.6rem', cursor: 'pointer', fontWeight: 700 }}>승인</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
