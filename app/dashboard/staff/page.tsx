'use client';
import { useState, useEffect, useCallback } from 'react';
import AppNav from '../../../components/AppNav';
import Link from 'next/link';

interface StaffSummary { user_uid: string; user_name: string; work_days: number; total_hours: number; late_days: number; }
interface Att { id: string; user_uid: string; user_name: string; date: string; clock_in?: string; clock_out?: string; late_minutes: number; }

export default function StaffPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [summary, setSummary] = useState<StaffSummary[]>([]);
  const [records, setRecords] = useState<Att[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/staff/attendance?month=${month}`);
    if (res.ok) {
      const d = await res.json() as { records: Att[]; summary: StaffSummary[] };
      setRecords(d.records); setSummary(d.summary);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const computePayroll = async () => {
    setLoading(true);
    const res = await fetch('/api/staff/payroll', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month }),
    });
    if (res.ok) {
      const d = await res.json() as { computed: number };
      setMsg(`급여 계산 완료 (${d.computed}명)`);
    } else {
      const e = await res.json() as { error: string };
      setMsg(`오류: ${e.error}`);
    }
    setLoading(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const fmt = (iso?: string) => iso ? new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-';

  const filteredRecs = selected ? records.filter((r) => r.user_uid === selected) : records;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.6rem' }}>👩‍🏫</span>
            <h1 style={{ fontWeight: 900, fontSize: '1.4rem', color: '#1e293b', margin: 0 }}>교사 근태 관리</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
              style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.4rem 0.75rem' }} />
            <button onClick={computePayroll} disabled={loading}
              style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              {loading ? '계산 중...' : '💰 급여 계산'}
            </button>
            <Link href="/dashboard/staff/payroll">
              <button style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                급여 명세서
              </button>
            </Link>
          </div>
        </div>

        {msg && <div style={{ background: msg.includes('오류') ? '#fee2e2' : '#dcfce7', color: msg.includes('오류') ? '#991b1b' : '#166534', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: 600 }}>{msg}</div>}

        {/* 요약 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {summary.map((s) => (
            <button key={s.user_uid} onClick={() => setSelected(selected === s.user_uid ? null : s.user_uid)}
              style={{ background: selected === s.user_uid ? '#eff6ff' : 'white', border: `2px solid ${selected === s.user_uid ? '#6366f1' : '#e2e8f0'}`, borderRadius: '0.75rem', padding: '1rem', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>{s.user_name || s.user_uid}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                출근 {s.work_days}일 · {s.total_hours}시간
                {s.late_days > 0 && <span style={{ color: '#ef4444', marginLeft: '0.4rem' }}>지각 {s.late_days}회</span>}
              </div>
            </button>
          ))}
          {summary.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>이번 달 근태 데이터가 없습니다</div>}
        </div>

        {/* 상세 기록 테이블 */}
        {filteredRecs.length > 0 && (
          <div style={{ background: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead><tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['날짜', '이름', '출근', '퇴근', '지각'].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '0.82rem' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filteredRecs.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.65rem 1rem' }}>{r.date}</td>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>{r.user_name}</td>
                    <td style={{ padding: '0.65rem 1rem', color: '#22c55e' }}>{fmt(r.clock_in)}</td>
                    <td style={{ padding: '0.65rem 1rem', color: '#6366f1' }}>{fmt(r.clock_out)}</td>
                    <td style={{ padding: '0.65rem 1rem', color: r.late_minutes > 0 ? '#ef4444' : '#94a3b8' }}>
                      {r.late_minutes > 0 ? `${r.late_minutes}분` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
