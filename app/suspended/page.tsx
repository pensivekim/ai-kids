'use client';

import { useRouter } from 'next/navigation';
import { logoutAndClear } from '../../lib/auth';

export default function SuspendedPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAndClear();
    router.push('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef2f2' }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
        <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#dc2626', marginBottom: '0.75rem' }}>서비스 이용 정지</h2>
        <p style={{ color: '#64748b', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          현재 서비스 이용이 정지된 상태입니다.<br />
          문의: <a href="tel:07082258585" style={{ color: '#0d9488', textDecoration: 'none', fontWeight: 600 }}>070-8225-8585</a>
        </p>
        <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1.2rem', cursor: 'pointer', color: '#64748b', fontSize: '0.9rem' }}>
          로그아웃
        </button>
      </div>
    </div>
  );
}
