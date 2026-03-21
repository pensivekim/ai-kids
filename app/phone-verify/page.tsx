'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { matchPhoneToCenter } from '../../lib/auth';

export default function PhoneVerifyPage() {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' }}>
        <p style={{ color: '#64748b' }}>Loading...</p>
      </div>
    );
  }

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.push('/login');
    }
  }, [loading, firebaseUser, router]);

  if (!firebaseUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' }}>
        <p style={{ color: '#64748b' }}>Loading...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);

    const normalized = phone.replace(/[^0-9]/g, '');
    if (normalized.length < 10 || normalized.length > 11) {
      setError('올바른 전화번호를 입력해주세요.');
      setSubmitting(false);
      return;
    }

    try {
      const result = await matchPhoneToCenter(firebaseUser.uid, normalized);

      if (result.matched) {
        setSuccess(`${result.centerName}에 연결되었습니다!`);
        // 쿠키 업데이트
        const opts = 'path=/; max-age=86400; SameSite=Lax';
        document.cookie = `kids_role=teacher; ${opts}`;
        document.cookie = `kids_status=active; ${opts}`;
        document.cookie = `kids_org_status=active; ${opts}`;
        setTimeout(() => router.push('/tools'), 1500);
      } else {
        setError('등록된 전화번호를 찾을 수 없습니다. 원장님께 사전등록을 요청해주세요.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '2.5rem' }}>📱</span>
          <h1 style={{ fontWeight: 900, fontSize: '1.4rem', color: '#0d9488', margin: '0.5rem 0 0' }}>
            전화번호 확인
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.5rem 0 0', lineHeight: 1.6 }}>
            원장님이 등록하신 전화번호를 입력하면<br />
            어린이집에 자동으로 연결됩니다.
          </p>
        </div>

        <div className="card">
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.75rem', color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem', padding: '0.75rem', color: '#16a34a', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600 }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label">전화번호</label>
              <input
                className="input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="01012345678"
                style={{ fontSize: '1.1rem', letterSpacing: '0.05em' }}
              />
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                '-' 없이 숫자만 입력하세요
              </p>
            </div>
            <button className="btn-primary" type="submit" disabled={submitting} style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}>
              {submitting ? '확인 중...' : '어린이집 연결하기'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.7, margin: 0 }}>
              <strong style={{ color: '#475569' }}>전화번호가 등록되지 않았다면?</strong><br />
              원장님께 AI Kids 대시보드에서 선생님 이름과 전화번호를 등록해달라고 요청하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
