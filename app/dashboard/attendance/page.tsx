'use client';
import { useState, useEffect, useCallback } from 'react';
import AppNav from '../../../components/AppNav';
import Link from 'next/link';

interface Child { id: string; name: string; class_name: string; parent_phone: string; }
interface AttRec { child_id: string; check_in: string; check_out: string; method: string; }

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [children, setChildren] = useState<Child[]>([]);
  const [records, setRecords] = useState<AttRec[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/attendance?date=${date}`);
    if (res.ok) {
      const d = await res.json() as { children: Child[]; records: AttRec[] };
      setChildren(d.children);
      setRecords(d.records);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const punch = async (childId: string, type: 'in' | 'out') => {
    setLoading(true);
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId, type, method: 'manual' }),
    });
    if (res.ok) { setMsg(type === 'in' ? '등원 완료' : '하원 완료'); load(); }
    setLoading(false);
    setTimeout(() => setMsg(''), 2000);
  };

  const recMap = new Map(records.map((r) => [r.child_id, r]));
  const classes = [...new Set(children.map((c) => c.class_name || '미분류'))].sort();
  const presentCount = records.filter((r) => r.check_in).length;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.6rem' }}>📋</span>
            <div>
              <h1 style={{ fontWeight: 900, fontSize: '1.4rem', color: '#1e293b', margin: 0 }}>출결 관리</h1>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                {date} · 등원 {presentCount}/{children.length}명
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.4rem 0.75rem', fontSize: '0.9rem' }} />
            <Link href="/dashboard/attendance/qr">
              <button style={{ background: '#0d9488', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.45rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                📷 QR 스캔
              </button>
            </Link>
            <a href={`/api/attendance/report?month=${date.slice(0,7)}&format=csv`}>
              <button style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                📥 복지로 CSV
              </button>
            </a>
          </div>
        </div>

        {msg && <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: 600 }}>{msg}</div>}

        {classes.map((cls) => (
          <div key={cls} style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#475569', marginBottom: '0.75rem' }}>{cls}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
              {children.filter((c) => (c.class_name || '미분류') === cls).map((child) => {
                const rec = recMap.get(child.id);
                const present = !!rec?.check_in;
                const gone = !!rec?.check_out;
                return (
                  <div key={child.id} style={{
                    background: 'white', border: `2px solid ${present ? (gone ? '#e2e8f0' : '#22c55e') : '#fee2e2'}`,
                    borderRadius: '0.75rem', padding: '1rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>{child.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        {rec?.check_in ? `등원 ${new Date(rec.check_in).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}` : '미등원'}
                        {rec?.check_out ? ` · 하원 ${new Date(rec.check_out).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => punch(child.id, 'in')} disabled={loading || present}
                        style={{ background: present ? '#f1f5f9' : '#22c55e', color: present ? '#94a3b8' : 'white', border: 'none', borderRadius: '0.4rem', padding: '0.35rem 0.65rem', cursor: present ? 'default' : 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                        등원
                      </button>
                      <button onClick={() => punch(child.id, 'out')} disabled={loading || !present || gone}
                        style={{ background: !present || gone ? '#f1f5f9' : '#6366f1', color: !present || gone ? '#94a3b8' : 'white', border: 'none', borderRadius: '0.4rem', padding: '0.35rem 0.65rem', cursor: !present || gone ? 'default' : 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                        하원
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
