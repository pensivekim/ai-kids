'use client';

import { useState } from 'react';
import AppNav from '../../../components/AppNav';
import { useAI } from '../../../lib/useAI';
import ModelSelector from '../../../components/ModelSelector';

type SubTool = 'activity' | 'story' | 'ideas' | 'play';

const TOOLS = [
  { id: 'activity' as SubTool, label: '활동 계획안', icon: '📚' },
  { id: 'story' as SubTool, label: '동화 스토리', icon: '📖' },
  { id: 'ideas' as SubTool, label: '미술·요리·체육 아이디어', icon: '🎨' },
  { id: 'play' as SubTool, label: '발달 단계별 놀이', icon: '🎯' },
];

function Activity({ generate, loading }: { generate: (p: string) => void; loading: boolean }) {
  const [age, setAge] = useState('');
  const [theme, setTheme] = useState('');
  const [domain, setDomain] = useState('신체');

  return (
    <form onSubmit={(e) => { e.preventDefault(); generate(
      `어린이집 활동 계획안을 작성해주세요.\n연령: ${age}\n활동 영역: ${domain}\n주제: ${theme}\n\n[지침] 활동목표(3가지), 준비물, 도입-전개-마무리 단계, 교사 발문, 유의사항 포함. 전문적인 보육 문서 형식으로.`
    ); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label className="label">연령</label>
          <input className="input" value={age} onChange={(e) => setAge(e.target.value)} required placeholder="예: 만 4세" />
        </div>
        <div>
          <label className="label">활동 영역</label>
          <select className="input" value={domain} onChange={(e) => setDomain(e.target.value)}>
            {['신체', '언어', '인지', '사회관계', '예술경험', '자연탐구'].map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">활동 주제</label>
        <input className="input" value={theme} onChange={(e) => setTheme(e.target.value)} required placeholder="예: 봄꽃 관찰하기, 친구와 협동하기" />
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? '생성 중...' : '활동 계획안 생성'}
      </button>
    </form>
  );
}

function Story({ generate, loading }: { generate: (p: string) => void; loading: boolean }) {
  const [character, setCharacter] = useState('');
  const [theme, setTheme] = useState('');
  const [ageGroup, setAgeGroup] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); generate(
      `어린이집 아이들을 위한 동화를 창작해주세요.\n주인공: ${character}\n주제/교훈: ${theme}\n연령: ${ageGroup}\n\n[지침] 기승전결 구조, 아이들이 좋아하는 반복 구조 포함, 삽화 설명 포함, 교훈은 자연스럽게 녹여내기. 읽어주기 좋은 문체.`
    ); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="label">주인공 (동물, 사물 등)</label>
        <input className="input" value={character} onChange={(e) => setCharacter(e.target.value)} required placeholder="예: 작은 씨앗, 겁쟁이 토끼" />
      </div>
      <div>
        <label className="label">주제 / 교훈</label>
        <input className="input" value={theme} onChange={(e) => setTheme(e.target.value)} required placeholder="예: 용기, 나눔, 환경 보호" />
      </div>
      <div>
        <label className="label">대상 연령</label>
        <input className="input" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} required placeholder="예: 만 3~5세" />
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? '창작 중...' : '동화 생성'}
      </button>
    </form>
  );
}

function Ideas({ generate, loading }: { generate: (p: string) => void; loading: boolean }) {
  const [category, setCategory] = useState('미술');
  const [age, setAge] = useState('');
  const [theme, setTheme] = useState('');
  const [count, setCount] = useState('5');

  return (
    <form onSubmit={(e) => { e.preventDefault(); generate(
      `어린이집 ${category} 활동 아이디어 ${count}가지를 제안해주세요.\n연령: ${age}\n연계 주제: ${theme}\n\n[지침] 각 아이디어마다 활동명, 준비물, 간단한 방법, 기대효과 포함. 실제 현장에서 바로 활용 가능한 아이디어로.`
    ); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label className="label">분야</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {['미술', '요리', '체육', '음악', '과학탐구'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">연령</label>
          <input className="input" value={age} onChange={(e) => setAge(e.target.value)} required placeholder="만 3세" />
        </div>
        <div>
          <label className="label">개수</label>
          <select className="input" value={count} onChange={(e) => setCount(e.target.value)}>
            {['3', '5', '7', '10'].map((n) => <option key={n}>{n}개</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">연계 주제 (선택)</label>
        <input className="input" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="예: 봄, 가족, 동물" />
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? '생성 중...' : `${category} 아이디어 생성`}
      </button>
    </form>
  );
}

function Play({ generate, loading }: { generate: (p: string) => void; loading: boolean }) {
  const [months, setMonths] = useState('');
  const [concern, setConcern] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); generate(
      `아이의 발달 단계에 맞는 놀이를 추천해주세요.\n연령: ${months}개월\n특이사항/관심사: ${concern || '없음'}\n\n[지침] 인지발달, 언어발달, 신체발달, 사회정서발달 영역별 맞춤 놀이 추천. 각 놀이마다 방법, 준비물, 발달 효과 포함. 집에서도 할 수 있는 놀이 위주로.`
    ); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="label">아이 개월 수</label>
        <input className="input" type="number" value={months} onChange={(e) => setMonths(e.target.value)} required placeholder="예: 36 (만 3세)" min={0} max={84} />
      </div>
      <div>
        <label className="label">아이 특이사항 / 관심사 (선택)</label>
        <textarea className="input" value={concern} onChange={(e) => setConcern(e.target.value)} placeholder="예: 공룡을 좋아함, 또래 상호작용 연습 필요" />
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? '추천 중...' : '발달 맞춤 놀이 추천'}
      </button>
    </form>
  );
}

export default function EduContentPage() {
  const [active, setActive] = useState<SubTool>('activity');
  const { output, loading, error, generate, copy, model, setModel } = useAI();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => { copy(); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <span style={{ fontSize: '1.6rem' }}>👶</span>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1e293b', margin: 0 }}>보육·교육 콘텐츠</h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>활동 계획, 동화, 놀이 추천을 AI가 즉시 생성</p>
          </div>
        </div>

        <ModelSelector value={model} onChange={setModel} />
        <div className="tool-layout">
          <div className="card" style={{ padding: '0.5rem' }}>
            {TOOLS.map((t) => (
              <button key={t.id} onClick={() => setActive(t.id)} style={{ width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: active === t.id ? '#fff7ed' : 'transparent', color: active === t.id ? '#ea580c' : '#374151', fontWeight: active === t.id ? 700 : 400, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card">
              {active === 'activity' && <Activity generate={generate} loading={loading} />}
              {active === 'story' && <Story generate={generate} loading={loading} />}
              {active === 'ideas' && <Ideas generate={generate} loading={loading} />}
              {active === 'play' && <Play generate={generate} loading={loading} />}
            </div>

            {(output || loading || error) && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151' }}>AI 생성 결과</span>
                  {output && <button onClick={handleCopy} style={{ background: copied ? '#ea580c' : '#f1f5f9', color: copied ? 'white' : '#374151', border: 'none', borderRadius: '0.4rem', padding: '0.35rem 0.85rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>{copied ? '복사됨 ✓' : '복사'}</button>}
                </div>
                {error && <p style={{ color: '#dc2626' }}>{error}</p>}
                {loading && !output && <p style={{ color: '#ea580c' }}>⏳ AI가 생성 중...</p>}
                {output && <div className="output-box">{output}</div>}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
