'use client';

import { useState } from 'react';
import AppNav from '../../../components/AppNav';
import { useAI } from '../../../lib/useAI';

type SubTool = 'newsletter' | 'diary' | 'plan' | 'letter' | 'guide';

const TOOLS: { id: SubTool; label: string; icon: string }[] = [
  { id: 'newsletter', label: '가정통신문', icon: '📝' },
  { id: 'diary', label: '보육일지·관찰일지', icon: '📔' },
  { id: 'plan', label: '월간·연간 계획안', icon: '📅' },
  { id: 'letter', label: '공문·민원 답변', icon: '📨' },
  { id: 'guide', label: '입소·식단 안내문', icon: '📄' },
];

// ── 가정통신문 ─────────────────────────────────────────────────────────────
function Newsletter({ generate, loading }: { generate: (p: string) => void; loading: boolean }) {
  const [topic, setTopic] = useState('');
  const [month, setMonth] = useState('');
  const [points, setPoints] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate(`당신은 어린이집 전문 행정 보조 AI입니다. 아래 정보를 바탕으로 가정통신문을 완성해주세요.

[입력 정보]
- 제목/주제: ${topic}
- 발행 월: ${month}월
- 주요 내용: ${points}

[작성 지침]
- 인사말로 시작 (계절감 반영)
- 핵심 안내 내용 명확하게 전달
- 학부모가 읽기 쉬운 친근한 문체
- 마무리 인사로 끝
- 완성된 가정통신문 본문만 출력 (제목 포함)`);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="label">가정통신문 주제</label>
        <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} required placeholder="예: 봄 소풍 안내, 독감 예방 수칙" />
      </div>
      <div>
        <label className="label">발행 월</label>
        <input className="input" type="number" min={1} max={12} value={month} onChange={(e) => setMonth(e.target.value)} required placeholder="예: 3" />
      </div>
      <div>
        <label className="label">포함할 내용 (간단히)</label>
        <textarea className="input" value={points} onChange={(e) => setPoints(e.target.value)} required placeholder="예: 4월 14일 소풍, 도시락 지참, 편한 복장, 우천 시 취소" />
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? 'AI 작성 중...' : '가정통신문 생성'}
      </button>
    </form>
  );
}

// ── 보육일지·관찰일지 ─────────────────────────────────────────────────────
function Diary({ generate, loading }: { generate: (p: string) => void; loading: boolean }) {
  const [type, setType] = useState<'보육일지' | '관찰일지'>('보육일지');
  const [date, setDate] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [memo, setMemo] = useState('');
  const [childName, setChildName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isObserve = type === '관찰일지';
    generate(`당신은 보육 전문 AI입니다. 교사의 짧은 메모를 전문적인 ${type} 서술로 변환해주세요.

[입력 정보]
- 유형: ${type}
- 날짜: ${date}
- 연령/반: ${ageGroup}
${isObserve ? `- 아동 이름: ${childName}` : ''}
- 교사 메모: ${memo}

[작성 지침]
- 전문적이고 객관적인 보육 용어 사용
- 아이의 발달 및 행동을 구체적으로 서술
- 완성된 ${type} 본문만 출력`);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="label">유형</label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(['보육일지', '관찰일지'] as const).map((t) => (
            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="radio" checked={type === t} onChange={() => setType(t)} /> {t}
            </label>
          ))}
        </div>
      </div>
      {type === '관찰일지' && (
        <div>
          <label className="label">아동 이름</label>
          <input className="input" value={childName} onChange={(e) => setChildName(e.target.value)} required placeholder="홍길동" />
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label className="label">날짜</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label className="label">연령/반</label>
          <input className="input" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} required placeholder="예: 만 3세 / 해바라기반" />
        </div>
      </div>
      <div>
        <label className="label">교사 메모 (짧게 OK)</label>
        <textarea className="input" value={memo} onChange={(e) => setMemo(e.target.value)} required rows={4} placeholder="예: 오늘 블록 놀이 열심히 함. 친구랑 사이좋게 나눠씀. 점심 잘 먹음. 낮잠 30분." />
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? 'AI 작성 중...' : `${type} 생성`}
      </button>
    </form>
  );
}

// ── 월간·연간 계획안 ─────────────────────────────────────────────────────
function Plan({ generate, loading }: { generate: (p: string) => void; loading: boolean }) {
  const [planType, setPlanType] = useState<'월간' | '연간'>('월간');
  const [month, setMonth] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [theme, setTheme] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate(`당신은 보육 전문 교육 계획 AI입니다. 아래 정보를 바탕으로 ${planType} 보육계획안 초안을 작성해주세요.

[입력 정보]
- 유형: ${planType} 보육계획안
${planType === '월간' ? `- 월: ${month}월` : ''}
- 연령: ${ageGroup}
- 주제/테마: ${theme}

[작성 지침]
- 주간별 활동 구성 (신체, 언어, 인지, 사회관계, 예술)
- 연령 발달에 맞는 활동 제안
- 실내·실외 활동 균형
- 표 형식으로 정리
- 완성된 계획안만 출력`);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="label">계획안 유형</label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(['월간', '연간'] as const).map((t) => (
            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="radio" checked={planType === t} onChange={() => setPlanType(t)} /> {t}
            </label>
          ))}
        </div>
      </div>
      {planType === '월간' && (
        <div>
          <label className="label">월</label>
          <input className="input" type="number" min={1} max={12} value={month} onChange={(e) => setMonth(e.target.value)} required placeholder="예: 4" />
        </div>
      )}
      <div>
        <label className="label">연령/반</label>
        <input className="input" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} required placeholder="예: 만 4세 / 별빛반" />
      </div>
      <div>
        <label className="label">월 주제/테마</label>
        <input className="input" value={theme} onChange={(e) => setTheme(e.target.value)} required placeholder="예: 봄과 자연, 가족과 사랑" />
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? 'AI 작성 중...' : `${planType} 계획안 생성`}
      </button>
    </form>
  );
}

// ── 공문·민원 답변 ────────────────────────────────────────────────────────
function Letter({ generate, loading }: { generate: (p: string) => void; loading: boolean }) {
  const [situation, setSituation] = useState('');
  const [tone, setTone] = useState<'공식' | '친근'>('공식');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate(`당신은 어린이집 행정 전문 AI입니다. 아래 상황에 맞는 답변 문서를 작성해주세요.

[상황]
${situation}

[문체]: ${tone}적

[지침]
- 명확하고 정중한 표현 사용
- 핵심 내용을 간결하게 전달
- 필요 시 향후 조치 계획 포함
- 완성된 답변 문서만 출력`);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="label">상황 설명</label>
        <textarea className="input" value={situation} onChange={(e) => setSituation(e.target.value)} required rows={5} placeholder="예: 학부모가 아이 낙상 사고에 대한 공식 해명을 요청함. 사고 경위: 블록 놀이 중 넘어짐, 무릎 찰과상, 즉시 처치 완료, 학부모 전화 통보 완료." />
      </div>
      <div>
        <label className="label">문체</label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(['공식', '친근'] as const).map((t) => (
            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="radio" checked={tone === t} onChange={() => setTone(t)} /> {t}적
            </label>
          ))}
        </div>
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? 'AI 작성 중...' : '답변 문서 생성'}
      </button>
    </form>
  );
}

// ── 입소·식단 안내문 ──────────────────────────────────────────────────────
function Guide({ generate, loading }: { generate: (p: string) => void; loading: boolean }) {
  const [guideType, setGuideType] = useState<'입소' | '식단'>('입소');
  const [centerName, setCenterName] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = guideType === '입소'
      ? `어린이집 입소 안내문을 작성해주세요.
원 이름: ${centerName}
포함 내용: ${details}
[지침] 입소 절차, 준비물, 적응 기간, 생활 규칙 등 포함. 친근하고 따뜻한 문체.`
      : `어린이집 주간 식단 안내문을 작성해주세요.
원 이름: ${centerName}
식단 정보: ${details}
[지침] 요일별 식단 표 형식, 영양 균형 안내, 알레르기 주의사항 포함.`;
    generate(prompt);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="label">안내문 유형</label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(['입소', '식단'] as const).map((t) => (
            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="radio" checked={guideType === t} onChange={() => setGuideType(t)} /> {t} 안내문
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="label">어린이집 이름</label>
        <input className="input" value={centerName} onChange={(e) => setCenterName(e.target.value)} required placeholder="예: 햇살어린이집" />
      </div>
      <div>
        <label className="label">{guideType === '입소' ? '포함할 특이사항' : '식단 내용 (간단히)'}</label>
        <textarea className="input" value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder={guideType === '입소' ? '예: 7:30 개원, 친환경 급식, 자연놀이 중심' : '예: 월-잡채밥, 화-된장찌개, 수-카레라이스...'} />
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? 'AI 작성 중...' : `${guideType} 안내문 생성`}
      </button>
    </form>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────
export default function AdminDocPage() {
  const [active, setActive] = useState<SubTool>('newsletter');
  const { output, loading, error, generate, copy } = useAI();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <span style={{ fontSize: '1.6rem' }}>📋</span>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1e293b', margin: 0 }}>행정·문서</h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>반복 문서를 AI가 대신 작성합니다</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* 사이드바 */}
          <div className="card" style={{ padding: '0.5rem' }}>
            {TOOLS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem',
                  borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                  background: active === t.id ? '#f0fdf4' : 'transparent',
                  color: active === t.id ? '#0d9488' : '#374151',
                  fontWeight: active === t.id ? 700 : 400,
                  fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* 입력 + 출력 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card">
              {active === 'newsletter' && <Newsletter generate={generate} loading={loading} />}
              {active === 'diary' && <Diary generate={generate} loading={loading} />}
              {active === 'plan' && <Plan generate={generate} loading={loading} />}
              {active === 'letter' && <Letter generate={generate} loading={loading} />}
              {active === 'guide' && <Guide generate={generate} loading={loading} />}
            </div>

            {(output || loading || error) && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151' }}>AI 작성 결과</span>
                  {output && (
                    <button onClick={handleCopy} style={{ background: copied ? '#0d9488' : '#f1f5f9', color: copied ? 'white' : '#374151', border: 'none', borderRadius: '0.4rem', padding: '0.35rem 0.85rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      {copied ? '복사됨 ✓' : '복사'}
                    </button>
                  )}
                </div>
                {error && <p style={{ color: '#dc2626', fontSize: '0.9rem' }}>{error}</p>}
                {loading && !output && (
                  <div style={{ color: '#0d9488', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> AI가 작성 중...
                  </div>
                )}
                {output && <div className="output-box">{output}</div>}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
