'use client';
import { useState, useEffect, useCallback } from 'react';
import AppNav from '../../../components/AppNav';

interface Slot { id: string; teacher_name?: string; slot_date: string; slot_time: string; duration_minutes: number; is_available: number; booking_id?: string; child_name?: string; parent_name?: string; parent_phone?: string; topic?: string; booking_status?: string; notes?: string; summary?: string; }

export default function ConsultationsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [notes, setNotes] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [showCreateSlots, setShowCreateSlots] = useState(false);
  const [newSlots, setNewSlots] = useState([{ date: new Date().toISOString().split('T')[0], time: '09:00' }]);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/consultations?month=${month}`);
    if (res.ok) setSlots(await res.json() as Slot[]);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const createSlots = async () => {
    const res = await fetch('/api/consultations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slots: newSlots }) });
    if (res.ok) { setMsg('슬롯 생성 완료'); setShowCreateSlots(false); load(); setTimeout(() => setMsg(''), 2000); }
  };

  const completeConsult = async () => {
    if (!selected?.booking_id) return;
    const res = await fetch(`/api/consultations/${selected.booking_id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', notes }),
    });
    if (res.ok) { setMsg('상담 완료 처리됨'); setSelected(null); setNotes(''); load(); setTimeout(() => setMsg(''), 2000); }
  };

  const summarize = async () => {
    if (!selected?.booking_id || !notes) return;
    setSummarizing(true);
    const res = await fetch('/api/consultations/summarize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: selected.booking_id, notes }) });
    if (res.ok) { const d = await res.json() as { summary: string }; setAiSummary(d.summary); }
    setSummarizing(false);
  };

  const byDate = slots.reduce((acc, s) => {
    if (!acc[s.slot_date]) acc[s.slot_date] = [];
    acc[s.slot_date].push(s);
    return acc;
  }, {} as Record<string, Slot[]>);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.6rem' }}>📅</span>
            <h1 style={{ fontWeight: 900, fontSize: '1.4rem', color: '#1e293b', margin: 0 }}>부모 상담 예약</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
              style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.4rem 0.75rem' }} />
            <button onClick={() => setShowCreateSlots(!showCreateSlots)}
              style={{ background: '#0d9488', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              + 슬롯 생성
            </button>
          </div>
        </div>

        {msg && <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: 600 }}>{msg}</div>}

        {/* 슬롯 생성 */}
        {showCreateSlots && (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, margin: '0 0 0.75rem' }}>상담 슬롯 추가</h3>
            {newSlots.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <input type="date" value={s.date} onChange={(e) => { const n = [...newSlots]; n[i].date = e.target.value; setNewSlots(n); }}
                  style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.4rem' }} />
                <input type="time" value={s.time} onChange={(e) => { const n = [...newSlots]; n[i].time = e.target.value; setNewSlots(n); }}
                  style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.4rem' }} />
                <button onClick={() => setNewSlots(newSlots.filter((_, j) => j !== i))}
                  style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '0.4rem', padding: '0.35rem 0.6rem', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setNewSlots([...newSlots, { date: new Date().toISOString().split('T')[0], time: '10:00' }])}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.4rem 0.75rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                + 시간 추가
              </button>
              <button onClick={createSlots}
                style={{ background: '#0d9488', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                생성
              </button>
            </div>
          </div>
        )}

        {/* 날짜별 슬롯 */}
        {Object.entries(byDate).sort().map(([date, dateSlots]) => (
          <div key={date} style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#475569', marginBottom: '0.75rem' }}>{date}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem' }}>
              {dateSlots.map((slot) => (
                <div key={slot.id} style={{ background: 'white', border: `2px solid ${slot.booking_id ? '#6366f1' : '#e2e8f0'}`, borderRadius: '0.75rem', padding: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.3rem' }}>{slot.slot_time}</div>
                  {slot.booking_id ? (
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600 }}>{slot.child_name} 학부모</div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{slot.parent_name} · {slot.parent_phone}</div>
                      {slot.topic && <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.3rem' }}>📝 {slot.topic}</div>}
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.35rem' }}>
                        <span style={{ background: slot.booking_status === 'completed' ? '#dcfce7' : '#ede9fe', color: slot.booking_status === 'completed' ? '#166534' : '#7c3aed', fontSize: '0.75rem', padding: '0.15rem 0.45rem', borderRadius: '1rem', fontWeight: 600 }}>
                          {slot.booking_status === 'completed' ? '완료' : '예약됨'}
                        </span>
                        {slot.booking_status !== 'completed' && (
                          <button onClick={() => { setSelected(slot); setNotes(slot.notes || ''); setAiSummary(''); }}
                            style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.35rem', padding: '0.15rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                            상담 완료 처리
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>예약 가능</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {slots.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
            상담 슬롯을 생성하고 부모님께 예약 링크를 공유하세요
          </div>
        )}

        {/* 상담 완료 모달 */}
        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>상담 기록 · {selected.child_name}</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>{selected.slot_date} {selected.slot_time} · {selected.parent_name}</p>
              <textarea placeholder="상담 내용 메모 (이후 AI 요약에 활용됩니다)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={6}
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem', fontSize: '0.9rem', boxSizing: 'border-box', marginBottom: '0.75rem' }} />
              {aiSummary && (
                <div style={{ background: '#f5f3ff', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.87rem', lineHeight: 1.7, color: '#3730a3' }}>
                  <strong>AI 요약</strong><br />{aiSummary}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => { setSelected(null); setAiSummary(''); }} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.6rem', cursor: 'pointer' }}>취소</button>
                <button onClick={summarize} disabled={summarizing || !notes}
                  style={{ flex: 1, background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: '0.5rem', padding: '0.6rem', cursor: 'pointer', fontWeight: 600 }}>
                  {summarizing ? 'AI 요약중...' : '🤖 AI 요약'}
                </button>
                <button onClick={completeConsult}
                  style={{ flex: 2, background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.6rem', cursor: 'pointer', fontWeight: 700 }}>
                  완료 저장
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
