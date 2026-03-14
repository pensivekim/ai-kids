'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithEmail, signUpWithEmail, createCenter } from '../../lib/auth';
import { getUserDoc } from '../../lib/auth';
import { ROLE_HOME } from '../../types';

type Tab = 'login' | 'teacher-signup' | 'center-signup';

export default function LoginPage() {
  const router = useRouter();
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

  const setCookies = (role: string, status: string, orgStatus: string) => {
    const opts = 'path=/; max-age=86400; SameSite=Lax';
    document.cookie = `kids_role=${role}; ${opts}`;
    document.cookie = `kids_status=${status}; ${opts}`;
    document.cookie = `kids_org_status=${orgStatus}; ${opts}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await loginWithEmail(email, password);
      const doc = await getUserDoc(user.uid);
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
      const user = await loginWithEmail(cEmail, cPassword).catch(async () => {
        const u = await signUpWithEmail(cEmail, cPassword, cName);
        return u;
      });
      await createCenter(user.uid, cEmail, cName, cCenter, 'starter');
      setCookies('center_admin', 'pending', 'active');
      router.push('/pending');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '가입 실패');
    } finally { setLoading(false); }
  };

  const tabStyle = (t: Tab) => ({
    padding: '0.6rem 1.2rem',
    borderBottom: tab === t ? '2px solid #0d9488' : '2px solid transparent',
    color: tab === t ? '#0d9488' : '#64748b',
    fontWeight: tab === t ? 700 : 400,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    borderBottom: tab === t ? '2px solid #0d9488' : '2px solid transparent',
    fontSize: '0.9rem',
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
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', gap: '0.5rem' }}>
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
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>
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
