'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../lib/auth';

export default function AppNav() {
  const { userDoc } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    document.cookie = 'kids_role=; max-age=0; path=/';
    document.cookie = 'kids_status=; max-age=0; path=/';
    document.cookie = 'kids_org_status=; max-age=0; path=/';
    router.push('/login');
  };

  const navLinks = userDoc?.role === 'super_admin'
    ? [
        { href: '/admin', label: '관리자' },
        { href: '/tools', label: 'AI 도구' },
      ]
    : userDoc?.role === 'center_admin'
    ? [
        { href: '/dashboard', label: '대시보드' },
        { href: '/tools', label: 'AI 도구' },
      ]
    : [{ href: '/tools', label: 'AI 도구' }];

  return (
    <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <span style={{ fontSize: '1.4rem' }}>🌱</span>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0d9488' }}>AI Kids</span>
        </Link>
        <nav style={{ display: 'flex', gap: '0.25rem' }}>
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '0.4rem',
              fontSize: '0.9rem',
              fontWeight: pathname.startsWith(l.href) ? 700 : 400,
              color: pathname.startsWith(l.href) ? '#0d9488' : '#64748b',
              background: pathname.startsWith(l.href) ? '#f0fdf4' : 'transparent',
              textDecoration: 'none',
            }}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {userDoc && (
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {userDoc.centerName ? `${userDoc.centerName} · ` : ''}{userDoc.displayName}
          </span>
        )}
        <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.35rem 0.85rem', cursor: 'pointer', fontSize: '0.85rem', color: '#64748b' }}>
          로그아웃
        </button>
      </div>
    </header>
  );
}
