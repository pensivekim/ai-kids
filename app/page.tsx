'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TOOL_CATEGORIES, ROLE_HOME, SEAT_PRICE, MIN_SEATS, AI_MODELS_DISPLAY } from '../types';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const role = document.cookie.match(/kids_role=([^;]+)/)?.[1];
    if (role && ROLE_HOME[role as keyof typeof ROLE_HOME]) {
      router.replace(ROLE_HOME[role as keyof typeof ROLE_HOME]);
    }
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)' }}>
      {/* 헤더 */}
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.6rem' }}>🌱</span>
          <span style={{ fontWeight: 800, fontSize: '1.3rem', color: '#0d9488' }}>AI Kids</span>
          <span style={{ fontSize: '0.75rem', background: '#ccfbf1', color: '#0f766e', padding: '0.15rem 0.5rem', borderRadius: '1rem', fontWeight: 600 }}>어린이집 전용</span>
        </div>
        <Link href="/login">
          <button className="btn-primary">시작하기</button>
        </Link>
      </header>

      {/* 히어로 */}
      <section style={{ textAlign: 'center', padding: '5rem 2rem 3rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🌱</div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#0d9488', margin: '0 0 1rem' }}>
          어린이집 선생님을 위한<br />AI 올인원 도우미
        </h1>
        <p style={{ fontSize: '1.15rem', color: '#475569', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          가정통신문, 보육일지, 계획안, SNS 문구, 학부모 상담 답변까지.<br />
          반복되는 문서 업무를 AI가 대신합니다.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login">
            <button className="btn-primary" style={{ fontSize: '1.05rem', padding: '0.85rem 2.5rem' }}>
              무료로 시작하기
            </button>
          </Link>
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          첫 14일 무료 체험 · 카드 등록 불필요
        </p>
      </section>

      {/* 기능 카드 */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 2rem 5rem' }}>
        <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.6rem', color: '#1e293b', marginBottom: '2.5rem' }}>
          5가지 핵심 기능
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {TOOL_CATEGORIES.map((cat) => (
            <div key={cat.id} className="card" style={{ border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{cat.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0d9488', margin: '0 0 0.5rem' }}>{cat.label}</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 1rem', lineHeight: 1.6 }}>{cat.desc}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {cat.tools.map((t) => (
                  <span key={t.id} style={{ background: '#f0fdf4', color: '#0d9488', fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: '1rem', border: '1px solid #a7f3d0' }}>
                    {t.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 요금제 */}
      <section style={{ background: 'white', padding: '4rem 2rem' }}>
        <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.6rem', color: '#1e293b', marginBottom: '0.75rem' }}>
          요금제
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.95rem', marginBottom: '2.5rem' }}>
          선생님 수만큼만 납부 · 추가 인원 시 자동 반영
        </p>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div className="card" style={{ border: '2px solid #0d9488', textAlign: 'center', position: 'relative' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0d9488', margin: '0.5rem 0 0.25rem' }}>
              {SEAT_PRICE.toLocaleString()}<span style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 500 }}>원 / 월 / 선생님</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.25rem 0 1.5rem' }}>
              최소 {MIN_SEATS}명 · 예) 10명 원 → 월 {(SEAT_PRICE * 10).toLocaleString()}원
            </p>

            {/* 사용 모델 */}
            <div style={{ background: '#f8fafc', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.6rem' }}>사용 AI 모델</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {AI_MODELS_DISPLAY.map((m) => (
                  <span key={m.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.25rem 0.65rem', fontSize: '0.8rem', color: '#374151' }}>
                    <span style={{ color: '#94a3b8', marginRight: '0.3rem', fontSize: '0.72rem' }}>{m.badge}</span>
                    {m.name}
                  </span>
                ))}
              </div>
            </div>

            <Link href="/login">
              <button className="btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}>무료로 시작하기</button>
            </Link>
            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>첫 14일 무료 체험 · 카드 등록 불필요</p>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
        © 2026 AI Kids by Genomic Inc. · ai-kids.genomic.cc
      </footer>
    </div>
  );
}
