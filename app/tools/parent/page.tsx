'use client';

import { useState } from 'react';
import AppNav from '../../../components/AppNav';
import { useAI } from '../../../lib/useAI';

type SubTool = 'consult' | 'sensitive' | 'notification';

const TOOLS = [
  { id: 'consult' as SubTool, label: '상담 내용 요약', icon: '🗒️' },
  { id: 'sensitive' as SubTool, label: '민감한 사안 답변', icon: '💬' },
  { id: 'notification' as SubTool, label: '개인화 알림장', icon: '✉️' },
];

function Consult({ generate, loading }: { generate: (p: string) => void; loading: boolean }) {
  const [raw, setRaw] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); generate(
      `아래 상담 내용을 전문적으로 요약해주세요.\n\n[상담 내용 원문]\n${raw}\n\n[지침]\n- 상담 일시, 참석자, 핵심 논의 내용, 합의 사항, 다음 단계 형식으로 정리\n- 객관적이고 명확한 표현 사용\n- 완성된 상담 요약문만 출력`
    ); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="label">상담 내용 (날것으로 입력 OK)</label>
        <textarea className="input" value={raw} onChange={(e) => setRaw(e.target.value)} required rows={8} placeholder="예: 오늘 3시에 민준이 어머니 상담. 어머니 왈 요즘 아이가 친구 때린다고 집에서 얘기했다고. 확인해보니 블록 다툼이었음. 아이들 화해시켰고 앞으로 관찰하기로 함. 어머니도 이해함. 다음달에 다시 연락주기로." />
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? '요약 중...' : '상담 요약 생성'}
      </button>
    </form>
  );
}

function Sensitive({ generate, loading }: { generate: (p: string) => void; loading: boolean }) {
  const [situation, setSituation] = useState('');
  const [stance, setStance] = useState('공감 + 해명');

  return (
    <form onSubmit={(e) => { e.preventDefault(); generate(
      `다음 민감한 상황에 대한 학부모 답변 문구를 작성해주세요.\n\n[상황]\n${situation}\n\n[답변 방향]: ${stance}\n\n[지침]\n- 먼저 학부모의 감정에 공감\n- 사실 기반으로 명확하게 설명\n- 재발 방지 대책 포함\n- 방어적이지 않고 진정성 있는 문체\n- 완성된 답변 문구만 출력`
    ); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="label">상황 설명</label>
        <textarea className="input" value={situation} onChange={(e) => setSituation(e.target.value)} required rows={5} placeholder="예: 급식 중 아이가 생선 가시를 삼켜 목이 따갑다고 함. 학부모에게 즉시 연락했으나 학부모가 매우 화가 난 상태. 어떻게 답변해야 할지 모르겠음." />
      </div>
      <div>
        <label className="label">답변 방향</label>
        <select className="input" value={stance} onChange={(e) => setStance(e.target.value)}>
          {['공감 + 해명', '사과 + 재발방지', '사실 전달 + 후속 조치', '정중한 거절'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? '작성 중...' : '답변 문구 생성'}
      </button>
    </form>
  );
}

function Notification({ generate, loading }: { generate: (p: string) => void; loading: boolean }) {
  const [children, setChildren] = useState('');
  const [date, setDate] = useState('');
  const [memo, setMemo] = useState('');

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const lines = children.split('\n').filter((l) => l.trim());
      generate(
        `다음 아이들 각각에 대해 개인화된 알림장 문구를 작성해주세요.\n\n[날짜] ${date}\n[공통 메모] ${memo || '없음'}\n\n[아이 목록 (이름: 메모)]\n${lines.join('\n')}\n\n[지침]\n- 각 아이마다 이름을 넣어 개인화\n- 따뜻하고 구체적인 표현 사용\n- 각 아이 알림장은 3~4문장\n- 아이의 당일 특이사항 자연스럽게 포함\n- 형식: [이름] 알림장: (내용)`
      );
    }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="label">날짜</label>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div>
        <label className="label">공통 사항 (오늘 있었던 일)</label>
        <input className="input" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="예: 오늘 봄 텃밭 활동, 점심 볶음밥 맛있게 먹음" />
      </div>
      <div>
        <label className="label">아이별 메모 (한 줄에 한 명: 이름: 메모)</label>
        <textarea className="input" value={children} onChange={(e) => setChildren(e.target.value)} required rows={6} placeholder={'예:\n김민준: 오늘 블록 놀이 집중, 낮잠 30분\n이서연: 밥 잘 먹음, 친구한테 먼저 말 걸었음\n박지후: 조금 칭얼댐, 코 살짝 흘림'} />
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? '작성 중...' : '알림장 일괄 생성'}
      </button>
    </form>
  );
}

export default function ParentPage() {
  const [active, setActive] = useState<SubTool>('consult');
  const { output, loading, error, generate, copy } = useAI();
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { copy(); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <span style={{ fontSize: '1.6rem' }}>👨‍👩‍👧</span>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1e293b', margin: 0 }}>학부모 소통</h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>상담 요약, 민감한 답변, 알림장을 AI가 도와드립니다</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <div className="card" style={{ padding: '0.5rem' }}>
            {TOOLS.map((t) => (
              <button key={t.id} onClick={() => setActive(t.id)} style={{ width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: active === t.id ? '#eff6ff' : 'transparent', color: active === t.id ? '#2563eb' : '#374151', fontWeight: active === t.id ? 700 : 400, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card">
              {active === 'consult' && <Consult generate={generate} loading={loading} />}
              {active === 'sensitive' && <Sensitive generate={generate} loading={loading} />}
              {active === 'notification' && <Notification generate={generate} loading={loading} />}
            </div>
            {(output || loading || error) && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151' }}>AI 생성 결과</span>
                  {output && <button onClick={handleCopy} style={{ background: copied ? '#2563eb' : '#f1f5f9', color: copied ? 'white' : '#374151', border: 'none', borderRadius: '0.4rem', padding: '0.35rem 0.85rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>{copied ? '복사됨 ✓' : '복사'}</button>}
                </div>
                {error && <p style={{ color: '#dc2626' }}>{error}</p>}
                {loading && !output && <p style={{ color: '#2563eb' }}>⏳ AI가 작성 중...</p>}
                {output && <div className="output-box">{output}</div>}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
