'use client';
import { useState, useEffect, useCallback } from 'react';
import AppNav from '../../../../components/AppNav';

interface Payroll { id: string; user_name: string; year_month: string; base_salary: number; overtime_pay: number; deductions: number; net_pay: number; work_days: number; total_hours: number; late_count: number; status: string; notes?: string; }

export default function PayrollPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [records, setRecords] = useState<Payroll[]>([]);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/staff/payroll?month=${month}`);
    if (res.ok) { const d = await res.json() as { records: Payroll[] }; setRecords(d.records); }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const update = async (id: string, status: string) => {
    await fetch('/api/staff/payroll', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    setMsg(`${status === 'confirmed' ? '확정' : '지급'} 처리됨`);
    load(); setTimeout(() => setMsg(''), 2000);
  };

  const totalNet = records.reduce((s, r) => s + r.net_pay, 0);
  const statusColor = (s: string) => ({ draft: '#fef3c7', confirmed: '#dbeafe', paid: '#dcfce7' }[s] || '#f1f5f9');
  const statusLabel = (s: string) => ({ draft: '초안', confirmed: '확정', paid: '지급완료' }[s] || s);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.6rem' }}>💰</span>
            <div>
              <h1 style={{ fontWeight: 900, fontSize: '1.4rem', color: '#1e293b', margin: 0 }}>급여 명세서</h1>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>총 지급액: {totalNet.toLocaleString()}원</p>
            </div>
          </div>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.4rem 0.75rem' }} />
        </div>

        {msg && <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: 600 }}>{msg}</div>}

        <div style={{ background: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '700px' }}>
            <thead><tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['이름','출근일','총시간','기본급','연장수당','공제','실지급액','상태','조치'].map((h, i) => (
                <th key={h} style={{ padding: '0.75rem 0.85rem', textAlign: i === 0 ? 'left' : 'right', fontWeight: 700, color: '#475569', fontSize: '0.82rem' }}>
                  {h}
                </th>
              ))}
            </tr></thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700 }}>{r.user_name}</td>
                  <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>{r.work_days}일</td>
                  <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>{r.total_hours}h</td>
                  <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>{r.base_salary.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: '#22c55e' }}>{r.overtime_pay.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: '#ef4444' }}>{r.deductions > 0 ? `-${r.deductions.toLocaleString()}` : '-'}</td>
                  <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 900, color: '#1e293b' }}>{r.net_pay.toLocaleString()}원</td>
                  <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>
                    <span style={{ background: statusColor(r.status), padding: '0.2rem 0.55rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>{statusLabel(r.status)}</span>
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>
                    {r.status === 'draft' && <button onClick={() => update(r.id, 'confirmed')} style={{ background: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: '0.35rem', padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>확정</button>}
                    {r.status === 'confirmed' && <button onClick={() => update(r.id, 'paid')} style={{ background: '#dcfce7', color: '#166534', border: 'none', borderRadius: '0.35rem', padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>지급완료</button>}
                  </td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>급여 데이터가 없습니다. 근태 페이지에서 급여 계산을 실행하세요.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
