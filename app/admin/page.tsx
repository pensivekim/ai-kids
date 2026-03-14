'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppNav from '../../components/AppNav';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import type { Center, KidsUser } from '../../types';

export default function AdminPage() {
  const { userDoc, loading } = useAuth();
  const router = useRouter();
  const [centers, setCenters] = useState<Center[]>([]);
  const [pendingCenters, setPendingCenters] = useState<Center[]>([]);
  const [tab, setTab] = useState<'centers' | 'pending'>('centers');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && userDoc?.role !== 'super_admin') {
      router.push('/tools');
    }
  }, [loading, userDoc, router]);

  useEffect(() => {
    if (userDoc?.role === 'super_admin') loadData();
  }, [userDoc]);

  const loadData = async () => {
    const db = getFirebaseDb();
    const snap = await getDocs(collection(db, 'centers'));
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Center));
    setCenters(all.filter((c) => c.status === 'active'));
    setPendingCenters(all.filter((c) => c.status === 'pending'));
  };

  const handleActivate = async (centerId: string, adminUid: string) => {
    setActionLoading(centerId);
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'centers', centerId), { status: 'active' });
    await updateDoc(doc(db, 'users', adminUid), { status: 'active' });
    await loadData();
    setActionLoading(null);
  };

  const handleSuspend = async (centerId: string) => {
    setActionLoading(centerId);
    await updateDoc(doc(getFirebaseDb(), 'centers', centerId), { status: 'suspended' });
    await loadData();
    setActionLoading(null);
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>로딩 중...</div>;

  const tabStyle = (t: string) => ({
    padding: '0.55rem 1.2rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
    fontSize: '0.9rem', fontWeight: tab === t ? 700 : 400,
    background: tab === t ? '#0d9488' : 'transparent',
    color: tab === t ? 'white' : '#64748b',
  } as React.CSSProperties);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1e293b', margin: '0 0 0.25rem' }}>슈퍼어드민</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>전체 어린이집 관리</p>
        </div>

        {/* 통계 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: '전체 활성 원', value: centers.length, icon: '🏫', color: '#0d9488' },
            { label: '승인 대기', value: pendingCenters.length, icon: '⏳', color: '#f59e0b' },
          ].map((s) => (
            <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.label}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'white', padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', width: 'fit-content' }}>
          <button style={tabStyle('centers')} onClick={() => setTab('centers')}>활성 원 목록</button>
          <button style={tabStyle('pending')} onClick={() => setTab('pending')}>
            승인 대기 {pendingCenters.length > 0 && <span style={{ background: '#dc2626', color: 'white', borderRadius: '1rem', padding: '0 0.4rem', fontSize: '0.75rem', marginLeft: '0.3rem' }}>{pendingCenters.length}</span>}
          </button>
        </div>

        {/* 활성 원 */}
        {tab === 'centers' && (
          <div className="card">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  {['어린이집', '원 코드', '요금제', '상태', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.75rem', color: '#64748b', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {centers.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>등록된 어린이집이 없습니다.</td></tr>
                )}
                {centers.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace', color: '#6366f1' }}>{c.code}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <span style={{ background: c.plan === 'pro' ? '#f3e8ff' : '#eff6ff', color: c.plan === 'pro' ? '#7c3aed' : '#2563eb', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>
                        {c.plan === 'pro' ? '프리미엄' : '스타터'}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <span style={{ background: '#dcfce7', color: '#16a34a', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>활성</span>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <button onClick={() => handleSuspend(c.id)} disabled={actionLoading === c.id} style={{ background: 'none', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '0.4rem', padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                        정지
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 승인 대기 */}
        {tab === 'pending' && (
          <div className="card">
            {pendingCenters.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>승인 대기 중인 어린이집이 없습니다.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingCenters.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>요청 요금제: {c.plan === 'pro' ? '프리미엄' : '스타터'}</div>
                    </div>
                    <button
                      onClick={() => handleActivate(c.id, c.adminUid)}
                      disabled={actionLoading === c.id}
                      className="btn-primary"
                      style={{ padding: '0.4rem 1.2rem' }}
                    >
                      {actionLoading === c.id ? '처리 중...' : '승인 활성화'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
