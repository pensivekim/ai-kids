'use client';

import { useRouter } from 'next/navigation';
import { logout } from '../../lib/auth';

export default function PendingPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    document.cookie = 'kids_role=; max-age=0; path=/';
    document.cookie = 'kids_status=; max-age=0; path=/';
    document.cookie = 'kids_org_status=; max-age=0; path=/';
    router.push('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#0d9488', marginBottom: '0.75rem' }}>승인 대기 중</h2>
        <p style={{ color: '#64748b', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          원장님의 승인을 기다리고 있습니다.<br />
          승인 완료 후 AI 도구를 이용할 수 있어요.
        </p>
        <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1.2rem', cursor: 'pointer', color: '#64748b', fontSize: '0.9rem' }}>
          로그아웃
        </button>
      </div>
    </div>
  );
}
