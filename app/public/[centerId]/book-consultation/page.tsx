export const runtime = 'edge';
'use client';
import { useState, useEffect } from 'react';
import { use } from 'react';

interface Slot { id: string; slot_date: string; slot_time: string; duration_minutes: number; teacher_name?: string; }

export default function BookConsultationPage({ params }: { params: Promise<{ centerId: string }> }) {
  const { centerId } = use(params);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [form, setForm] = useState({ childName: '', parentName: '', parentPhone: '', topic: '' });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7);
    fetch(`/api/consultations?centerId=${centerId}&month=${month}`)
      .then((r) => r.json())
      .then((d: unknown) => {
        const data = d as { slot_date: string; slot_time: string; id: string; is_available: number; booking_id?: string; duration_minutes: number; teacher_name?: string }[];
        setSlots(data.filter((s) => s.is_available && !s.booking_id));
      })
      .catch(() => {});
  }, [centerId]);

  const book = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    const res = await fetch(`/api/consultations/${selected.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, centerId }),
    });
    if (res.ok) setDone(true);
    else { const err = await res.json() as { error: string }; alert(err.error || '예약 실패'); }
    setLoading(false);
  };

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
      <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: '#166534', marginBottom: '0.5rem' }}>예약이 완료되었습니다!</h1>
      <p style={{ color: '#64748b' }}>{selected?.slot_date} {selected?.slot_time} · {form.parentName}님</p>
    </div>
  );

  const byDate = slots.reduce((acc, s) => { if (!acc[s.slot_date]) acc[s.slot_date] = []; acc[s.slot_date].push(s); return acc; }, {} as Record<string, Slot[]>);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📅</div>
          <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1e293b' }}>상담 예약</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>원하시는 시간을 선택하고 예약해 주세요</p>
        </div>

        {!selected ? (
          <div>
            {Object.entries(byDate).sort().map(([date, dateSlots]) => (
              <div key={date} style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569', marginBottom: '0.5rem' }}>{date}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {dateSlots.map((s) => (
                    <button key={s.id} onClick={() => setSelected(s)}
                      style={{ background: 'white', border: '2px solid #6366f1', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700, color: '#6366f1', fontSize: '0.9rem' }}>
                      {s.slot_time} ({s.duration_minutes}분)
                      {s.teacher_name && <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>{s.teacher_name} 선생님</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {slots.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>현재 예약 가능한 상담 시간이 없습니다</div>}
          </div>
        ) : (
          <div>
            <button onClick={() => setSelected(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.4rem 0.75rem', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.85rem' }}>
              ← 시간 다시 선택
            </button>
            <div style={{ background: '#ede9fe', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: '#7c3aed' }}>{selected.slot_date} {selected.slot_time}</div>
              {selected.teacher_name && <div style={{ fontSize: '0.85rem', color: '#7c3aed' }}>{selected.teacher_name} 선생님</div>}
            </div>
            <form onSubmit={book} style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: '아이 이름 *', key: 'childName', placeholder: '예: 김민준' },
                { label: '보호자 이름 *', key: 'parentName', placeholder: '예: 김철수' },
                { label: '연락처 *', key: 'parentPhone', placeholder: '010-0000-0000' },
                { label: '상담 주제 (선택)', key: 'topic', placeholder: '예: 친구 관계, 발달 상황' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>{label}</label>
                  <input value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder} required={!label.includes('선택')}
                    style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem', fontSize: '0.9rem', marginTop: '0.25rem', boxSizing: 'border-box' }} />
                </div>
              ))}
              <button type="submit" disabled={loading}
                style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.75rem', padding: '0.85rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem' }}>
                {loading ? '예약 중...' : '상담 예약 완료'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
