'use client';

import { useRouter } from 'next/navigation';
import { logoutAndClear } from '../../lib/auth';

export default function PendingPage() {
  const router = useRouter();

  const role = typeof document !== 'undefined'
    ? document.cookie.match(/kids_role=([^;]+)/)?.[1]
    : null;

  const isCenterAdmin = role === 'center_admin';

  const handleLogout = async () => {
    await logoutAndClear();
    router.push('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#0d9488', marginBottom: '0.75rem' }}>승인 대기 중</h2>
        <p style={{ color: '#64748b', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          {isCenterAdmin ? (
            <>어린이집 등록 신청이 접수되었습니다.<br />관리자 승인 후 서비스를 이용할 수 있어요.</>
          ) : (
            <>원장님의 승인을 기다리고 있습니다.<br />승인 완료 후 AI 도구를 이용할 수 있어요.</>
          )}
        </p>
        <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1.2rem', cursor: 'pointer', color: '#64748b', fontSize: '0.9rem' }}>
          로그아웃
        </button>
      </div>
    </div>
  );
}
