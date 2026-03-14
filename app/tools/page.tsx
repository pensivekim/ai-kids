'use client';

import Link from 'next/link';
import AppNav from '../../components/AppNav';
import { TOOL_CATEGORIES } from '../../types';

const COLOR: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  teal:   { bg: '#f0fdf4', border: '#a7f3d0', text: '#0d9488', badge: '#ccfbf1' },
  orange: { bg: '#fff7ed', border: '#fed7aa', text: '#ea580c', badge: '#ffedd5' },
  pink:   { bg: '#fdf2f8', border: '#fbcfe8', text: '#db2777', badge: '#fce7f3' },
  blue:   { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb', badge: '#dbeafe' },
  purple: { bg: '#faf5ff', border: '#e9d5ff', text: '#7c3aed', badge: '#ede9fe' },
};

export default function ToolsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <h1 style={{ fontWeight: 900, fontSize: '1.8rem', color: '#1e293b', marginBottom: '0.5rem' }}>AI 도구 모음</h1>
        <p style={{ color: '#64748b', marginBottom: '2.5rem' }}>카테고리를 선택해 원하는 도구를 사용하세요.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {TOOL_CATEGORIES.map((cat) => {
            const c = COLOR[cat.color];
            return (
              <Link key={cat.id} href={`/tools/${cat.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'white',
                  border: `1px solid ${c.border}`,
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s, transform 0.15s',
                  display: 'block',
                }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLDivElement).style.transform = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ background: c.bg, borderRadius: '0.75rem', padding: '0.75rem', fontSize: '1.6rem' }}>
                      {cat.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: c.text, margin: '0 0 0.4rem' }}>{cat.label}</h3>
                      <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 0.75rem', lineHeight: 1.5 }}>{cat.desc}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {cat.tools.map((t) => (
                          <span key={t.id} style={{ background: c.badge, color: c.text, fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '1rem' }}>
                            {t.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
