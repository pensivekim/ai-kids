'use client';
import { useState, useEffect, useCallback } from 'react';
import AppNav from '../../../components/AppNav';

interface Account {
  id: string; child_name: string; class_name: string; parent_phone: string;
  year_month: string; net_amount: number; status: string;
  virtual_account?: string; paid_at?: string;
}
interface Summary { status: string; count: number; total: number; }

export default function TuitionPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [bulkAmount, setBulkAmount] = useState('300000');
  const [bulkSubsidy, setBulkSubsidy] = useState('0');
  const [bulkDue, setBulkDue] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/tuition?month=${month}`);
    if (res.ok) {
      const d = await res.json() as { accounts: Account[]; summary: Summary[] };
      setAccounts(d.accounts); setSummary(d.summary);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string) => {
    const res = await fetch('/api/tuition', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    if (res.ok) { setMsg('처리 완료'); load(); setTimeout(() => setMsg(''), 2000); }
  };

  const createBulk = async () => {
    setLoading(true);
    const res = await fetch('/api/tuition', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, baseAmount: Number(bulkAmount), subsidyAmount: Number(bulkSubsidy), dueDate: bulkDue, bulkAll: true }),
    });
    if (res.ok) {
      const d = await res.json() as { created: number };
      setMsg(`${d.created}명 청구서 생성 완료`);
      setShowBulk(false); load();
    }
    setLoading(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const initiatePay = async (id: string, method: string) => {
    const res = await fetch('/api/tuition/payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: id, method }) });
    const d = await res.json() as { checkout_url?: string; accountNumber?: string; pending_setup?: boolean };
    if (d.checkout_url) window.open(d.checkout_url, '_blank');
    else if (d.accountNumber) setMsg(`가상계좌: ${d.accountNumber}`);
    else if (d.pending_setup) setMsg('결제 설정이 필요합니다. TOSS_SECRET_KEY를 등록해주세요.');
  };

  const statusColor = (s: string) =>
    s === 'paid' ? '#dcfce7' : s === 'overdue' ? '#fee2e2' : s === 'waived' ? '#f1f5f9' : '#fef3c7';
  const statusLabel = (s: string) =>
    s === 'paid' ? '납부완료' : s === 'overdue' ? '연체' : s === 'waived' ? '면제' : '미납';

  const totalUnpaid = accounts.filter((a) => a.status === 'pending' || a.status === 'overdue').reduce((s, a) => s + a.net_amount, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.6rem' }}>💰</span>
            <div>
              <h1 style={{ fontWeight: 900, fontSize: '1.4rem', color: '#1e293b', margin: 0 }}>원비 수납</h1>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>미납 합계: {totalUnpaid.toLocaleString()}원</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
              style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.4rem 0.75rem' }} />
            <button onClick={() => setShowBulk(!showBulk)}
              style={{ background: '#0d9488', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.45rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
              + 일괄 청구
            </button>
          </div>
        </div>

        {/* 요약 */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {summary.map((s) => (
            <div key={s.status} style={{ background: statusColor(s.status), borderRadius: '0.75rem', padding: '0.75rem 1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{statusLabel(s.status)}</div>
              <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>{s.count}명 · {Number(s.total).toLocaleString()}원</div>
            </div>
          ))}
        </div>

        {/* 일괄 청구 폼 */}
        {showBulk && (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, margin: '0 0 1rem' }}>일괄 청구서 생성 — {month}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div><label style={{ fontSize: '0.85rem', color: '#475569' }}>기본 원비</label>
                <input value={bulkAmount} onChange={(e) => setBulkAmount(e.target.value)} type="number"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.4rem' }} /></div>
              <div><label style={{ fontSize: '0.85rem', color: '#475569' }}>정부 보조금 차감</label>
                <input value={bulkSubsidy} onChange={(e) => setBulkSubsidy(e.target.value)} type="number"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.4rem' }} /></div>
              <div><label style={{ fontSize: '0.85rem', color: '#475569' }}>납부 기한</label>
                <input value={bulkDue} onChange={(e) => setBulkDue(e.target.value)} type="date"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.4rem' }} /></div>
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#6366f1', fontWeight: 600 }}>
              실납부액: {(Number(bulkAmount) - Number(bulkSubsidy)).toLocaleString()}원
            </div>
            <button onClick={createBulk} disabled={loading}
              style={{ marginTop: '0.75rem', background: '#0d9488', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.5rem', cursor: 'pointer', fontWeight: 700 }}>
              {loading ? '생성 중...' : '생성'}
            </button>
          </div>
        )}

        {msg && <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: 600 }}>{msg}</div>}

        {/* 목록 */}
        <div style={{ background: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead><tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['이름', '반', '금액', '상태', '가상계좌', '조치'].map((h) => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '0.82rem' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{a.child_name}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{a.class_name}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{a.net_amount.toLocaleString()}원</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ background: statusColor(a.status), padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      {statusLabel(a.status)}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>{a.virtual_account || '-'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {a.status !== 'paid' && a.status !== 'waived' && (
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button onClick={() => setStatus(a.id, 'paid')}
                          style={{ background: '#dcfce7', color: '#166534', border: 'none', borderRadius: '0.35rem', padding: '0.25rem 0.55rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                          현금완납
                        </button>
                        <button onClick={() => initiatePay(a.id, 'kakaopay')}
                          style={{ background: '#fef9c3', color: '#854d0e', border: 'none', borderRadius: '0.35rem', padding: '0.25rem 0.55rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                          카카오페이
                        </button>
                        <button onClick={() => initiatePay(a.id, 'virtual_account')}
                          style={{ background: '#eff6ff', color: '#1e40af', border: 'none', borderRadius: '0.35rem', padding: '0.25rem 0.55rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                          가상계좌
                        </button>
                      </div>
                    )}
                    {a.status === 'paid' && <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>✓ {a.paid_at?.slice(0,10)}</span>}
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>청구서가 없습니다. 일괄 청구 버튼으로 생성하세요.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
