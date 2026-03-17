'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import AppNav from '../../../components/AppNav';

interface Req { id: string; child_name: string; requested_by: string; date: string; drug_name: string; dosage: string; timing: string; note?: string; status: string; confirmed_by?: string; }

export default function MedicationPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [requests, setRequests] = useState<Req[]>([]);
  const [selected, setSelected] = useState<Req | null>(null);
  const [signing, setSigning] = useState(false);
  const [msg, setMsg] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/medication?date=${date}`);
    if (res.ok) setRequests(await res.json() as Req[]);
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const confirm = async (status: string) => {
    if (!selected) return;
    const canvas = canvasRef.current;
    const sig = canvas ? canvas.toDataURL() : '';
    const res = await fetch('/api/medication', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, status, signatureData: sig }),
    });
    if (res.ok) { setMsg(`${status === 'confirmed' ? '확인' : '완료'} 처리되었습니다`); setSelected(null); setSigning(false); load(); }
    setTimeout(() => setMsg(''), 2000);
  };

  // Canvas drawing
  const startDraw = (e: React.PointerEvent) => {
    drawing.current = true;
    const c = canvasRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const ctx = c.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
  };
  const draw = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const c = canvasRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const ctx = c.getContext('2d')!;
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2;
    ctx.stroke();
  };
  const endDraw = () => { drawing.current = false; };
  const clearSig = () => {
    const c = canvasRef.current;
    if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height);
  };

  const statusColor = (s: string) => s === 'confirmed' ? '#dcfce7' : s === 'completed' ? '#eff6ff' : s === 'rejected' ? '#fee2e2' : '#fef3c7';
  const statusLabel = (s: string) => s === 'confirmed' ? '확인됨' : s === 'completed' ? '투약완료' : s === 'rejected' ? '거절' : '대기중';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.6rem' }}>💊</span>
            <h1 style={{ fontWeight: 900, fontSize: '1.4rem', color: '#1e293b', margin: 0 }}>투약 의뢰</h1>
          </div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.4rem 0.75rem' }} />
        </div>

        {msg && <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: 600 }}>{msg}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {requests.map((r) => (
            <div key={r.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{r.child_name}</span>
                    <span style={{ background: statusColor(r.status), padding: '0.15rem 0.55rem', borderRadius: '1rem', fontSize: '0.78rem', fontWeight: 600 }}>{statusLabel(r.status)}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.7 }}>
                    <span>💊 <strong>{r.drug_name}</strong> · {r.dosage} · {r.timing}</span><br />
                    <span>보호자: {r.requested_by}</span>
                    {r.note && <><br /><span>📝 {r.note}</span></>}
                    {r.confirmed_by && <><br /><span style={{ color: '#22c55e' }}>✓ {r.confirmed_by} 확인</span></>}
                  </div>
                </div>
                {r.status === 'pending' && (
                  <button onClick={() => { setSelected(r); setSigning(true); }}
                    style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    서명 확인
                  </button>
                )}
                {r.status === 'confirmed' && (
                  <button onClick={() => { setSelected(r); confirm('completed'); }}
                    style={{ background: '#22c55e', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700 }}>
                    투약 완료
                  </button>
                )}
              </div>
            </div>
          ))}
          {requests.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>오늘 투약 의뢰가 없습니다</div>}
        </div>

        {/* 서명 모달 */}
        {signing && selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', maxWidth: '420px', width: '90%' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{selected.child_name} 투약 확인 서명</h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem' }}>{selected.drug_name} · {selected.dosage} · {selected.timing}</p>
              <div style={{ border: '2px solid #e2e8f0', borderRadius: '0.5rem', marginBottom: '0.75rem' }}>
                <canvas ref={canvasRef} width={360} height={160} style={{ display: 'block', touchAction: 'none', cursor: 'crosshair' }}
                  onPointerDown={startDraw} onPointerMove={draw} onPointerUp={endDraw} onPointerLeave={endDraw} />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem' }}>서명란에 서명해주세요</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={clearSig} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.6rem', cursor: 'pointer', fontWeight: 600 }}>지우기</button>
                <button onClick={() => { setSigning(false); setSelected(null); }} style={{ flex: 1, background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.6rem', cursor: 'pointer', fontWeight: 600 }}>취소</button>
                <button onClick={() => confirm('confirmed')} style={{ flex: 2, background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.6rem', cursor: 'pointer', fontWeight: 700 }}>확인 완료</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
