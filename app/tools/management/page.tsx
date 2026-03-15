'use client';

import { useState } from 'react';
import AppNav from '../../../components/AppNav';
import { useAI } from '../../../lib/useAI';
import ModelSelector from '../../../components/ModelSelector';

type SubTool = 'subsidy' | 'interview' | 'checklist' | 'minutes';

const TOOLS = [
  { id: 'subsidy' as SubTool, label: '보조금 신청서 초안', icon: '📑' },
  { id: 'interview' as SubTool, label: '교직원 면접 질문지', icon: '🎤' },
  { id: 'checklist' as SubTool, label: '시설 점검 체크리스트', icon: '✅' },
  { id: 'minutes' as SubTool, label: '회의록 요약', icon: '📝' },
];

function Subsidy({ generate, loading }: { generate: (p: string) => void; loading: boolean }) {
  const [subsidyName, setSubsidyName] = useState('');
  const [centerName, setCenterName] = useState('');
  const [details, setDetails] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); generate(
      `어린이집 보조금 신청서 초안을 작성해주세요.\n\n보조금명: ${subsidyName}\n어린이집 이름: ${centerName}\n신청 배경 및 필요성: ${details}\n\n[지침]\n- 공식 신청서 형식 (제목, 신청 기관, 신청 목적, 사업 내용, 기대 효과, 첨부 서류 목록)\n- 설득력 있는 필요성 서술\n- 담당 부처 용어 사용\n- 완성된 신청서 초안만 출력`
    ); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="label">보조금 / 사업명</label>
        <input className="input" value={subsidyName} onChange={(e) => setSubsidyName(e.target.value)} required placeholder="예: 보육교직원 처우개선비, 공공형 어린이집 지원" />
      </div>
      <div>
        <label className="label">어린이집 이름</label>
        <input className="input" value={centerName} onChange={(e) => setCenterName(e.target.value)} required placeholder="예: 햇살어린이집" />
      </div>
      <div>
        <label className="label">신청 배경 및 특이사항</label>
        <textarea className="input" value={details} onChange={(e) => setDetails(e.target.value)} rows={4} placeholder="예: 정원 40명, 농어촌 지역, 저소득층 비율 60%, 교직원 이직률 낮춤 필요" />
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? '작성 중...' : '신청서 초안 생성'}
      </button>
    </form>
  );
}

function Interview({ generate, loading }: { generate: (p: string) => void; loading: boolean }) {
  const [position, setPosition] = useState('');
  const [focus, setFocus] = useState('');
  const [count, setCount] = useState('10');

  return (
    <form onSubmit={(e) => { e.preventDefault(); generate(
      `어린이집 ${position} 채용 면접 질문지를 작성해주세요.\n중점 평가 항목: ${focus || '없음'}\n질문 수: ${count}개\n\n[지침]\n- 직무 역량, 인성, 상황 대처, 아동관, 팀워크 영역 포함\n- 행동기반 질문(STAR 기법) 포함\n- 각 질문에 평가 포인트 주석 달기\n- 완성된 질문지만 출력`
    ); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label className="label">채용 직위</label>
          <input className="input" value={position} onChange={(e) => setPosition(e.target.value)} required placeholder="예: 보육교사, 영양사, 조리원" />
        </div>
        <div>
          <label className="label">질문 수</label>
          <select className="input" value={count} onChange={(e) => setCount(e.target.value)}>
            {['5', '8', '10', '15'].map((n) => <option key={n}>{n}개</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">중점 평가 항목 (선택)</label>
        <input className="input" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="예: 아동 안전 민감성, 학부모 소통, 팀 협력" />
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? '생성 중...' : '면접 질문지 생성'}
      </button>
    </form>
  );
}

function Checklist({ generate, loading }: { generate: (p: string) => void; loading: boolean }) {
  const [checkType, setCheckType] = useState('안전 점검');
  const [season, setSeason] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); generate(
      `어린이집 ${checkType} 체크리스트를 작성해주세요.\n${season ? `계절/시기: ${season}` : ''}\n\n[지침]\n- 영역별로 구분 (실내, 실외, 급식, 교재교구 등)\n- 법적 의무 항목 반드시 포함\n- 담당자 확인란 포함\n- 체크박스([ ]) 형식으로 출력\n- 완성된 체크리스트만 출력`
    ); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="label">점검 유형</label>
        <select className="input" value={checkType} onChange={(e) => setCheckType(e.target.value)}>
          {['안전 점검', '위생·급식 점검', '화재·소방 점검', '교재교구 점검', '연간 시설 점검'].map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="label">계절/시기 (선택)</label>
        <input className="input" value={season} onChange={(e) => setSeason(e.target.value)} placeholder="예: 여름, 동계, 개학 전" />
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? '생성 중...' : '체크리스트 생성'}
      </button>
    </form>
  );
}

function Minutes({ generate, loading }: { generate: (p: string) => void; loading: boolean }) {
  const [raw, setRaw] = useState('');
  const [meetingDate, setMeetingDate] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); generate(
      `아래 회의 내용을 전문적인 회의록으로 정리해주세요.\n\n[회의 일시] ${meetingDate}\n[회의 내용 원문]\n${raw}\n\n[지침]\n- 회의 일시, 참석자, 안건별 논의 내용, 결정 사항, 담당자 및 기한, 다음 회의 안건 형식\n- 불필요한 내용 제거, 핵심만 간결하게\n- 완성된 회의록만 출력`
    ); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label className="label">회의 일시</label>
        <input className="input" type="datetime-local" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />
      </div>
      <div>
        <label className="label">회의 내용 (메모, 녹취 텍스트 등 자유롭게)</label>
        <textarea className="input" value={raw} onChange={(e) => setRaw(e.target.value)} required rows={8} placeholder="예: 오늘 직원회의. 참석: 원장, 담임3명, 보조교사2. 주요 안건: 1. 소풍 준비물 - 도시락 지참으로 결정, 2. 신규 교사 교육 - 다음 주 월요일 2시로 결정, 3. 에어컨 수리 - 최 교사가 업체에 연락하기로..." />
      </div>
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? '정리 중...' : '회의록 생성'}
      </button>
    </form>
  );
}

export default function ManagementPage() {
  const [active, setActive] = useState<SubTool>('subsidy');
  const { output, loading, error, generate, copy, model, setModel } = useAI();
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { copy(); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <AppNav />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <span style={{ fontSize: '1.6rem' }}>📊</span>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1e293b', margin: 0 }}>운영·경영</h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>보조금, 면접, 점검, 회의록을 AI가 처리</p>
          </div>
        </div>

        <ModelSelector value={model} onChange={setModel} />
        <div className="tool-layout">
          <div className="card" style={{ padding: '0.5rem' }}>
            {TOOLS.map((t) => (
              <button key={t.id} onClick={() => setActive(t.id)} style={{ width: '100%', textAlign: 'left', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: active === t.id ? '#faf5ff' : 'transparent', color: active === t.id ? '#7c3aed' : '#374151', fontWeight: active === t.id ? 700 : 400, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card">
              {active === 'subsidy' && <Subsidy generate={generate} loading={loading} />}
              {active === 'interview' && <Interview generate={generate} loading={loading} />}
              {active === 'checklist' && <Checklist generate={generate} loading={loading} />}
              {active === 'minutes' && <Minutes generate={generate} loading={loading} />}
            </div>
            {(output || loading || error) && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151' }}>AI 생성 결과</span>
                  {output && <button onClick={handleCopy} style={{ background: copied ? '#7c3aed' : '#f1f5f9', color: copied ? 'white' : '#374151', border: 'none', borderRadius: '0.4rem', padding: '0.35rem 0.85rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>{copied ? '복사됨 ✓' : '복사'}</button>}
                </div>
                {error && <p style={{ color: '#dc2626' }}>{error}</p>}
                {loading && !output && <p style={{ color: '#7c3aed' }}>⏳ AI가 작성 중...</p>}
                {output && <div className="output-box">{output}</div>}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
