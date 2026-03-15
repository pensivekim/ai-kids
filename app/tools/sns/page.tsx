'use client';

import { useState } from 'react';
import AppNav from '../../../components/AppNav';
import { useAI } from '../../../lib/useAI';
import ModelSelector from '../../../components/ModelSelector';

type SubTool = 'post' | 'intro' | 'cardnews';

const TOOLS = [
  { id: 'post' as SubTool, label: '인스타·블로그 포스팅', icon: '📸' },
  { id: 'intro' as SubTool, label: '원 소개 콘텐츠', icon: '🏫' },
  { id: 'cardnews' as SubTool, label: '카드뉴스 텍스트', icon: '🃏' },
];

function Post({ generate, loading }: { generate: (p: string) => void; loading: boolean }) {
  const [platform, setPlatform] = useState<'인스타그램' | '블로그'>('인스타그램');
  const [topic, setTopic] = useState('');
  const [mood, setMood] = useState('따뜻하고 친근한');

  return (
    <form onSubmit={(e) => { e.preventDefault(); generate(
      `어린이집 ${platform} 게시글을 작성해주세요.\n주제: ${topic}\n분위기/톤: ${mood}\n\n[지침]\n${platform === '인스타그램'
        ? '- 짧고 임팩트 있는 첫 문장\n- 이모지 적극 활용\n- 해시태그 15개 포함\n- 스토리 형식으로 공감 유도'
        : '- SEO 친화적 제목 포함\n- 소제목으로 구조화\n- 800자 이상\n- 마지막에 CTA(행동 유도) 포함'}\n완성된 게시글만 출력.`
    ); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="label">플랫폼</label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(['인스타그램', '블로그'] as const).map((p) => (
            <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="radio" checked={platform === p} onChange={() => setPlatform(p)} /> {p}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="label">게시글 주제</label>
        <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} required placeholder="예: 오늘 봄 소풍 다녀왔어요, 텃밭 활동" />
      </div>
      <div>
        <label className="label">분위기</label>
        <select className="input" value={mood} onChange={(e) => setMood(e.target.value)}>
          {['따뜻하고 친근한', '밝고 활기찬', '정보 전달형', '감성적인'].map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? '작성 중...' : `${platform} 게시글 생성`}
      </button>
    </form>
  );
}

function Intro({ generate, loading }: { generate: (p: string) => void; loading: boolean }) {
  const [centerName, setCenterName] = useState('');
  const [features, setFeatures] = useState('');
  const [target, setTarget] = useState('입소 대기 가정');

  return (
    <form onSubmit={(e) => { e.preventDefault(); generate(
      `어린이집 홍보 소개 콘텐츠를 작성해주세요.\n어린이집 이름: ${centerName}\n주요 특징: ${features}\n대상 독자: ${target}\n\n[지침] 어린이집의 강점을 부각, 입소를 원하는 학부모의 마음을 움직이는 설득력 있는 문구. 따뜻하고 전문적인 톤. 완성된 소개글만 출력.`
    ); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="label">어린이집 이름</label>
        <input className="input" value={centerName} onChange={(e) => setCenterName(e.target.value)} required placeholder="예: 햇살어린이집" />
      </div>
      <div>
        <label className="label">주요 특징·강점</label>
        <textarea className="input" value={features} onChange={(e) => setFeatures(e.target.value)} required rows={3} placeholder="예: 친환경 급식, 자연놀이 중심, 소규모 정원 30명, 원어민 영어수업" />
      </div>
      <div>
        <label className="label">대상</label>
        <input className="input" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="예: 입소 대기 가정, 현재 원아 학부모" />
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? '작성 중...' : '원 소개 콘텐츠 생성'}
      </button>
    </form>
  );
}

function CardNews({ generate, loading }: { generate: (p: string) => void; loading: boolean }) {
  const [topic, setTopic] = useState('');
  const [slides, setSlides] = useState('5');

  return (
    <form onSubmit={(e) => { e.preventDefault(); generate(
      `어린이집 카드뉴스 텍스트를 작성해주세요.\n주제: ${topic}\n슬라이드 수: ${slides}장\n\n[지침]\n- 각 슬라이드 번호 명시 (슬라이드 1, 슬라이드 2...)\n- 1장: 제목 + 시선을 끄는 한 줄\n- 중간: 핵심 내용 간결하게 (슬라이드당 2~3문장)\n- 마지막: 행동 유도 + 연락처 안내\n- 이모지 포함, 읽기 쉬운 짧은 문장\n완성된 카드뉴스 텍스트만 출력.`
    ); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="label">카드뉴스 주제</label>
        <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} required placeholder="예: 여름 안전 수칙, 입소 모집 안내" />
      </div>
      <div>
        <label className="label">슬라이드 수</label>
        <select className="input" value={slides} onChange={(e) => setSlides(e.target.value)}>
          {['4', '5', '6', '7', '8'].map((n) => <option key={n}>{n}장</option>)}
        </select>
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? '작성 중...' : '카드뉴스 텍스트 생성'}
      </button>
    </form>
  );
}

export default function SnsPage() {
  const [active, setActive] = useState<SubTool>('post');
  const { output, loading, error, generate, copy, model, setModel } = useAI();
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { copy(); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <span style={{ fontSize: '1.6rem' }}>📱</span>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1e293b', margin: 0 }}>SNS·홍보</h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>인스타그램, 블로그, 카드뉴스 문구를 AI가 완성</p>
          </div>
        </div>

        <ModelSelector value={model} onChange={setModel} />
        <div className="tool-layout">
          <div className="card" style={{ padding: '0.5rem' }}>
            {TOOLS.map((t) => (
              <button key={t.id} onClick={() => setActive(t.id)} style={{ width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: active === t.id ? '#fdf2f8' : 'transparent', color: active === t.id ? '#db2777' : '#374151', fontWeight: active === t.id ? 700 : 400, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card">
              {active === 'post' && <Post generate={generate} loading={loading} />}
              {active === 'intro' && <Intro generate={generate} loading={loading} />}
              {active === 'cardnews' && <CardNews generate={generate} loading={loading} />}
            </div>
            {(output || loading || error) && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151' }}>AI 생성 결과</span>
                  {output && <button onClick={handleCopy} style={{ background: copied ? '#db2777' : '#f1f5f9', color: copied ? 'white' : '#374151', border: 'none', borderRadius: '0.4rem', padding: '0.35rem 0.85rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>{copied ? '복사됨 ✓' : '복사'}</button>}
                </div>
                {error && <p style={{ color: '#dc2626' }}>{error}</p>}
                {loading && !output && <p style={{ color: '#db2777' }}>⏳ AI가 작성 중...</p>}
                {output && <div className="output-box">{output}</div>}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
