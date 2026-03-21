'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginWithEmail, signUpWithEmail, createCenter, loginWithKakao } from '../../lib/auth';
import { getUserDoc } from '../../lib/auth';
import { kakaoLogin } from '../../lib/kakao';
import { ROLE_HOME } from '../../types';

type Tab = 'login' | 'teacher-signup' | 'center-signup';

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' }}>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 로그인 폼
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 선생님 가입
  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPassword, setTPassword] = useState('');
  const [tCode, setTCode] = useState('');

  // 원장님(원) 가입
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPassword, setCPassword] = useState('');
  const [cCenter, setCCenter] = useState('');
  const [kakaoLoading, setKakaoLoading] = useState(false);

  // 카카오 콜백 처리
  useEffect(() => {
    const isKakao = searchParams.get('kakao');
    const kakaoId = searchParams.get('kakaoId');
    const nickname = searchParams.get('nickname') || '';
    if (isKakao && kakaoId) {
      (async () => {
        setKakaoLoading(true);
        try {
          const result = await loginWithKakao(kakaoId, nickname);
          const opts = 'path=/; max-age=86400; SameSite=Lax';
          if (result.isNew || !result.userDoc?.centerId) {
            document.cookie = `kids_role=teacher; ${opts}`;
            document.cookie = `kids_status=pending; ${opts}`;
            document.cookie = `kids_org_status=active; ${opts}`;
            router.push('/phone-verify');
          } else {
            const doc = result.userDoc;
            document.cookie = `kids_role=${doc.role}; ${opts}`;
            document.cookie = `kids_status=${doc.status}; ${opts}`;
            document.cookie = `kids_org_status=active; ${opts}`;
            if (doc.status === 'pending') { router.push('/pending'); return; }
            router.push(ROLE_HOME[doc.role]);
          }
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : '카카오 로그인 실패');
          setKakaoLoading(false);
        }
      })();
    }

    const errParam = searchParams.get('error');
    if (errParam) setError(`카카오 로그인 오류: ${errParam}`);
  }, [searchParams, router]);

  const setCookies = (role: string, status: string, orgStatus: string) => {
    const opts = 'path=/; max-age=86400; SameSite=Lax';
    document.cookie = `kids_role=${role}; ${opts}`;
    document.cookie = `kids_status=${status}; ${opts}`;
    document.cookie = `kids_org_status=${orgStatus}; ${opts}`;
  };

  const handleKakaoLogin = async () => {
    setError('');
    try {
      await kakaoLogin(); // 카카오 페이지로 리다이렉트
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '카카오 로그인 실패');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await loginWithEmail(email, password);
      const doc = await getUserDoc(user.uid, user.email ?? undefined);
      if (!doc) throw new Error('계정 정보를 찾을 수 없습니다.');
      setCookies(doc.role, doc.status, 'active');
      if (doc.status === 'pending') { router.push('/pending'); return; }
      router.push(ROLE_HOME[doc.role]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '로그인 실패');
    } finally { setLoading(false); }
  };

  const handleTeacherSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await signUpWithEmail(tEmail, tPassword, tName, tCode);
      setCookies('teacher', 'pending', 'active');
      router.push('/pending');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '가입 실패');
    } finally { setLoading(false); }
  };

  const handleCenterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await signUpWithEmail(cEmail, cPassword, cName);
      await createCenter(user.uid, cEmail, cName, cCenter);
      setCookies('center_admin', 'pending', 'active');
      router.push('/pending');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '가입 실패');
    } finally { setLoading(false); }
  };

  const tabStyle = (t: Tab) => ({
    flex: 1,
    padding: '0.6rem 0',
    textAlign: 'center',
    color: tab === t ? '#0d9488' : '#64748b',
    fontWeight: tab === t ? 700 : 400,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    borderBottom: tab === t ? '2px solid #0d9488' : '2px solid transparent',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
  } as React.CSSProperties);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '2.5rem' }}>🌱</span>
          <h1 style={{ fontWeight: 900, fontSize: '1.6rem', color: '#0d9488', margin: '0.5rem 0 0' }}>AI Kids</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>어린이집 AI 도우미</p>
        </div>

        <div className="card">
          {/* 탭 */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <button style={tabStyle('login')} onClick={() => setTab('login')}>로그인</button>
            <button style={tabStyle('teacher-signup')} onClick={() => setTab('teacher-signup')}>선생님 가입</button>
            <button style={tabStyle('center-signup')} onClick={() => setTab('center-signup')}>원장님 가입</button>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.75rem', color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {/* 로그인 */}
          {tab === 'login' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* 카카오 로그인 */}
              <button
                onClick={handleKakaoLogin}
                disabled={kakaoLoading}
                style={{
                  width: '100%', padding: '0.85rem', border: 'none', borderRadius: '0.75rem',
                  background: '#FEE500', color: '#191919', fontSize: '1rem', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 1C4.58 1 1 3.79 1 7.19c0 2.15 1.43 4.04 3.58 5.12l-.91 3.37c-.08.29.25.52.5.35l4.01-2.67c.27.03.54.04.82.04 4.42 0 8-2.79 8-6.21C17 3.79 13.42 1 9 1z" fill="#191919"/></svg>
                {kakaoLoading ? '로그인 중...' : '카카오로 시작하기'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.25rem 0' }}>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>또는 이메일로</span>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              </div>

              {/* 이메일 로그인 */}
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="label">이메일</label>
                  <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="이메일 입력" />
                </div>
                <div>
                  <label className="label">비밀번호</label>
                  <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="비밀번호 입력" />
                </div>
                <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '0.75rem' }}>
                  {loading ? '로그인 중...' : '이메일로 로그인'}
                </button>
              </form>
            </div>
          )}

          {/* 선생님 가입 */}
          {tab === 'teacher-signup' && (
            <form onSubmit={handleTeacherSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">이름</label>
                <input className="input" value={tName} onChange={(e) => setTName(e.target.value)} required placeholder="선생님 이름" />
              </div>
              <div>
                <label className="label">이메일</label>
                <input className="input" type="email" value={tEmail} onChange={(e) => setTEmail(e.target.value)} required placeholder="이메일 입력" />
              </div>
              <div>
                <label className="label">비밀번호</label>
                <input className="input" type="password" value={tPassword} onChange={(e) => setTPassword(e.target.value)} required placeholder="6자 이상" minLength={6} />
              </div>
              <div>
                <label className="label">원 코드 (원장님께 받으세요)</label>
                <input className="input" value={tCode} onChange={(e) => setTCode(e.target.value.toUpperCase())} required placeholder="6자리 코드 예: AB1234" maxLength={6} />
              </div>
              <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '0.75rem' }}>
                {loading ? '가입 중...' : '선생님으로 가입'}
              </button>
              <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>가입 후 원장님 승인이 필요합니다.</p>
            </form>
          )}

          {/* 원장님 가입 */}
          {tab === 'center-signup' && (
            <form onSubmit={handleCenterSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">원장님 이름</label>
                <input className="input" value={cName} onChange={(e) => setCName(e.target.value)} required placeholder="원장님 이름" />
              </div>
              <div>
                <label className="label">이메일</label>
                <input className="input" type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} required placeholder="이메일 입력" />
              </div>
              <div>
                <label className="label">비밀번호</label>
                <input className="input" type="password" value={cPassword} onChange={(e) => setCPassword(e.target.value)} required placeholder="6자 이상" minLength={6} />
              </div>
              <div>
                <label className="label">어린이집 이름</label>
                <input className="input" value={cCenter} onChange={(e) => setCCenter(e.target.value)} required placeholder="예: 햇살어린이집" />
              </div>
              <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '0.75rem' }}>
                {loading ? '신청 중...' : '어린이집 등록 신청'}
              </button>
              <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>Genomic 관리자 승인 후 이용 가능합니다.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
