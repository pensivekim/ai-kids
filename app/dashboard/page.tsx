'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppNav from '../../components/AppNav';
import { useAuth } from '../../contexts/AuthContext';
import { getPendingTeachers, getCenterMembers, approveUser, rejectUser, preregisterTeacher, getPreregisteredTeachers, deletePreregisteredTeacher } from '../../lib/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from '../../lib/firebase';
import type { KidsUser, Center } from '../../types';
import { SEAT_PRICE, MIN_SEATS } from '../../types';

export default function DashboardPage() {
  const { userDoc, loading } = useAuth();
  const router = useRouter();
  const [center, setCenter] = useState<Center | null>(null);
  const [pending, setPending] = useState<KidsUser[]>([]);
  const [members, setMembers] = useState<KidsUser[]>([]);
  const [tab, setTab] = useState<'overview' | 'members' | 'pending' | 'register'>('overview');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [preTeachers, setPreTeachers] = useState<{ id: string; name: string; phone: string; linked: boolean }[]>([]);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regMsg, setRegMsg] = useState('');

  useEffect(() => {
    if (!loading && userDoc?.role !== 'center_admin' && userDoc?.role !== 'super_admin') {
      router.push('/tools');
    }
  }, [loading, userDoc, router]);

  useEffect(() => {
    if (!userDoc?.centerId) return;
    loadData();
  }, [userDoc]);

  const loadData = async () => {
    if (!userDoc?.centerId) return;
    const db = getFirebaseDb();

    // 원 정보
    const q = query(collection(db, 'centers'), where('__name__', '==', userDoc.centerId));
    const snap = await getDocs(q);
    if (!snap.empty) setCenter({ id: snap.docs[0].id, ...snap.docs[0].data() } as Center);

    // 승인 대기
    const p = await getPendingTeachers(userDoc.centerId);
    setPending(p);

    // 전체 구성원
    const m = await getCenterMembers(userDoc.centerId);
    setMembers(m);

    // 사전등록 선생님
    const pre = await getPreregisteredTeachers(userDoc.centerId);
    setPreTeachers(pre);
  };

  const handleApprove = async (uid: string) => {
    setActionLoading(uid);
    await approveUser(uid);
    await loadData();
    setActionLoading(null);
  };

  const handleReject = async (uid: string) => {
    setActionLoading(uid);
    await rejectUser(uid);
    await loadData();
    setActionLoading(null);
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>로딩 중...</div>;

  const tabStyle = (t: string) => ({
    padding: '0.55rem 1.2rem',
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: tab === t ? 700 : 400,
    background: tab === t ? '#0d9488' : 'transparent',
    color: tab === t ? 'white' : '#64748b',
  } as React.CSSProperties);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1e293b', margin: '0 0 0.25rem' }}>
            {userDoc?.centerName ?? ''} 대시보드
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>원장님, 반갑습니다! 🌱</p>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'white', padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', width: 'fit-content' }}>
          <button style={tabStyle('overview')} onClick={() => setTab('overview')}>개요</button>
          <button style={tabStyle('members')} onClick={() => setTab('members')}>선생님 목록</button>
          <button style={tabStyle('pending')} onClick={() => setTab('pending')}>
            승인 대기 {pending.length > 0 && <span style={{ background: '#dc2626', color: 'white', borderRadius: '1rem', padding: '0 0.4rem', fontSize: '0.75rem', marginLeft: '0.3rem' }}>{pending.length}</span>}
          </button>
          <button style={tabStyle('register')} onClick={() => setTab('register')}>
            선생님 등록
          </button>
        </div>

        {/* 개요 */}
        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { label: '활성 선생님', value: `${members.filter(m => m.role === 'teacher').length}명`, icon: '👩‍🏫', color: '#0d9488' },
                { label: '승인 대기', value: `${pending.length}명`, icon: '⏳', color: '#f59e0b' },
                { label: '원 코드', value: center?.code ?? '-', icon: '🔑', color: '#6366f1' },
                { label: '이번 달 예상 청구', value: `${(Math.max(members.filter(m => m.role === 'teacher').length, MIN_SEATS) * SEAT_PRICE).toLocaleString()}원`, icon: '💳', color: '#8b5cf6' },
              ].map((s) => (
                <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 운영 도구 */}
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#475569', marginBottom: '0.75rem' }}>🔴 운영 필수</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { href: '/dashboard/attendance', icon: '📋', label: '출결 관리', desc: 'QR 출결 · 복지로 CSV' },
                { href: '/dashboard/tuition', icon: '💰', label: '원비 수납', desc: '청구 · 카카오페이 · 미납' },
                { href: '/dashboard/medication', icon: '💊', label: '투약 의뢰', desc: '부모 요청 · 교사 서명' },
              ].map((m) => (
                <a key={m.href} href={m.href} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'white', border: '2px solid #fee2e2', borderRadius: '0.75rem', padding: '1rem', cursor: 'pointer' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{m.icon}</div>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{m.label}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{m.desc}</div>
                  </div>
                </a>
              ))}
            </div>

            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#475569', marginBottom: '0.75rem' }}>🟡 안전·규정 준수</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { href: '/dashboard/cctv', icon: '📹', label: 'CCTV 열람 요청', desc: '신청·승인·기한 관리' },
                { href: '/dashboard/drills', icon: '🚒', label: '재난·소방 훈련', desc: '법정 횟수 자동 체크' },
                { href: '/dashboard/allergies', icon: '⚠️', label: '알레르기 급식', desc: '메뉴 저장 시 자동 경보' },
              ].map((m) => (
                <a key={m.href} href={m.href} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'white', border: '2px solid #fef3c7', borderRadius: '0.75rem', padding: '1rem', cursor: 'pointer' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{m.icon}</div>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{m.label}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{m.desc}</div>
                  </div>
                </a>
              ))}
            </div>

            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#475569', marginBottom: '0.75rem' }}>🟢 차별화 기능</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {[
                { href: '/dashboard/staff', icon: '👩‍🏫', label: '교사 근태·급여', desc: '출퇴근 · 급여 자동 계산' },
                { href: '/dashboard/accreditation', icon: '🏅', label: '평가인증 준비', desc: '22개 지표 체크리스트' },
                { href: '/dashboard/consultations', icon: '📅', label: '부모 상담 예약', desc: '캘린더 · AI 요약' },
              ].map((m) => (
                <a key={m.href} href={m.href} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'white', border: '2px solid #dcfce7', borderRadius: '0.75rem', padding: '1rem', cursor: 'pointer' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{m.icon}</div>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{m.label}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{m.desc}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 선생님 목록 */}
        {tab === 'members' && (
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>선생님 목록 ({members.length}명)</h3>
            {members.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>등록된 선생님이 없습니다.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    {['이름', '이메일', '상태'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.75rem', color: '#64748b', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.uid} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{m.displayName}</td>
                      <td style={{ padding: '0.65rem 0.75rem', color: '#64748b' }}>{m.email}</td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{ background: m.status === 'active' ? '#dcfce7' : '#fef9c3', color: m.status === 'active' ? '#16a34a' : '#a16207', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>
                          {m.status === 'active' ? '활성' : '비활성'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 승인 대기 */}
        {tab === 'pending' && (
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>승인 대기 ({pending.length}명)</h3>
            {pending.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>승인 대기 중인 선생님이 없습니다.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pending.map((u) => (
                  <div key={u.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.displayName}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{u.email}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleApprove(u.uid)}
                        disabled={actionLoading === u.uid}
                        className="btn-primary"
                        style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleReject(u.uid)}
                        disabled={actionLoading === u.uid}
                        style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: 'none', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '0.5rem', cursor: 'pointer' }}
                      >
                        거절
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 선생님 사전등록 */}
        {tab === 'register' && (
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>선생님 사전등록</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              선생님의 이름과 전화번호를 등록하면, 선생님이 카카오 로그인 후 전화번호만 입력하면 자동으로 연결됩니다.
            </p>

            {regMsg && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem', padding: '0.75rem', color: '#16a34a', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {regMsg}
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!userDoc?.centerId || !userDoc?.centerName) return;
              setRegLoading(true); setRegMsg('');
              try {
                await preregisterTeacher(userDoc.centerId, userDoc.centerName, regName, regPhone);
                setRegMsg(`${regName} 선생님이 등록되었습니다.`);
                setRegName(''); setRegPhone('');
                const pre = await getPreregisteredTeachers(userDoc.centerId);
                setPreTeachers(pre);
              } catch (err) {
                setRegMsg(err instanceof Error ? err.message : '등록 실패');
              } finally { setRegLoading(false); }
            }} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <input className="input" value={regName} onChange={(e) => setRegName(e.target.value)} required placeholder="선생님 이름" style={{ flex: '1 1 140px' }} />
              <input className="input" type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required placeholder="01012345678" style={{ flex: '1 1 160px' }} />
              <button className="btn-primary" type="submit" disabled={regLoading} style={{ padding: '0.6rem 1.5rem', whiteSpace: 'nowrap' }}>
                {regLoading ? '등록 중...' : '등록'}
              </button>
            </form>

            {/* 등록 목록 */}
            {preTeachers.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1.5rem' }}>사전등록된 선생님이 없습니다.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    {['이름', '전화번호', '상태', ''].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.75rem', color: '#64748b', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preTeachers.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t.name}</td>
                      <td style={{ padding: '0.65rem 0.75rem', color: '#64748b' }}>{t.phone}</td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{
                          background: t.linked ? '#dcfce7' : '#fef9c3',
                          color: t.linked ? '#16a34a' : '#a16207',
                          padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600,
                        }}>
                          {t.linked ? '연결됨' : '대기'}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        {!t.linked && (
                          <button
                            onClick={async () => {
                              await deletePreregisteredTeacher(t.id);
                              const pre = await getPreregisteredTeachers(userDoc!.centerId!);
                              setPreTeachers(pre);
                            }}
                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            삭제
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
