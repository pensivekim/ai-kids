'use client';
import { useState, useEffect } from 'react';
import AppNav from '../../../components/AppNav';

export default function ClockinPage() {
  const [today, setToday] = useState('');
  const [status, setStatus] = useState<{ clock_in?: string; clock_out?: string } | null>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToday(new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }));
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const res = await fetch('/api/staff/attendance');
    if (res.ok) {
      const d = await res.json() as { records: { clock_in?: string; clock_out?: string }[] };
      const todayStr = new Date().toISOString().split('T')[0];
      const rec = d.records.find((r: Record<string, unknown>) => (r as { date: string }).date === todayStr);
      setStatus(rec || null);
    }
  };

  const punch = async (type: 'in' | 'out') => {
    setLoading(true);
    const res = await fetch('/api/staff/attendance', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    if (res.ok) {
      setMsg(type === 'in' ? '✅ 출근 처리 완료!' : '✅ 퇴근 처리 완료!');
      loadStatus();
    }
    setLoading(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const fmt = (iso?: string) => iso ? new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4, #eff6ff)', display: 'flex', flexDirection: 'column' }}>
      <AppNav />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '1.5rem', padding: '2.5rem', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👋</div>
          <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1e293b', marginBottom: '0.25rem' }}>출퇴근 기록</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>{today}</p>

          {status ? (
            <div style={{ background: '#f8fafc', borderRadius: '1rem', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>출근</div>
                  <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#22c55e' }}>{fmt(status.clock_in) || '-'}</div>
                </div>
                <div style={{ width: '1px', background: '#e2e8f0' }} />
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>퇴근</div>
                  <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#6366f1' }}>{fmt(status.clock_out) || '-'}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: '#f8fafc', borderRadius: '1rem', padding: '1rem', marginBottom: '1.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
              오늘 출근 기록이 없습니다
            </div>
          )}

          {msg && <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: 700 }}>{msg}</div>}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => punch('in')} disabled={loading || !!status?.clock_in}
              style={{ flex: 1, background: status?.clock_in ? '#f1f5f9' : '#22c55e', color: status?.clock_in ? '#94a3b8' : 'white', border: 'none', borderRadius: '0.75rem', padding: '1rem', cursor: status?.clock_in ? 'default' : 'pointer', fontWeight: 700, fontSize: '1rem' }}>
              🌅 출근
            </button>
            <button onClick={() => punch('out')} disabled={loading || !status?.clock_in || !!status?.clock_out}
              style={{ flex: 1, background: !status?.clock_in || status?.clock_out ? '#f1f5f9' : '#6366f1', color: !status?.clock_in || status?.clock_out ? '#94a3b8' : 'white', border: 'none', borderRadius: '0.75rem', padding: '1rem', cursor: !status?.clock_in || status?.clock_out ? 'default' : 'pointer', fontWeight: 700, fontSize: '1rem' }}>
              🌙 퇴근
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
