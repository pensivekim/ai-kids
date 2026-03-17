'use client';
import { useState } from 'react';
import { use } from 'react';

export default function MedicationRequestPage({ params }: { params: Promise<{ centerId: string }> }) {
  const { centerId } = use(params);
  const [form, setForm] = useState({ child_name: '', requested_by: '', requester_phone: '', drug_name: '', dosage: '', timing: '', note: '' });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/medication', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, centerId }),
    });
    if (res.ok) setDone(true);
    setLoading(false);
  };

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
      <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: '#166534', marginBottom: '0.5rem' }}>투약 의뢰가 접수되었습니다</h1>
      <p style={{ color: '#4ade80', fontSize: '1rem' }}>담임 선생님이 확인 후 처리해 드립니다.</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💊</div>
          <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1e293b' }}>투약 의뢰서</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>선생님께 투약을 부탁드리는 양식입니다</p>
        </div>

        <form onSubmit={submit} style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { label: '아이 이름', key: 'child_name', placeholder: '예: 김민준', required: true },
            { label: '보호자 이름', key: 'requested_by', placeholder: '예: 김철수', required: true },
            { label: '보호자 연락처', key: 'requester_phone', placeholder: '010-0000-0000', required: false },
            { label: '약 이름', key: 'drug_name', placeholder: '예: 타이레놀 시럽', required: true },
            { label: '복용량', key: 'dosage', placeholder: '예: 5ml', required: true },
            { label: '복용 시간', key: 'timing', placeholder: '예: 점심 식후', required: true },
          ].map(({ label, key, placeholder, required }) => (
            <div key={key}>
              <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>{label}{required && ' *'}</label>
              <input value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder} required={required}
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.95rem', marginTop: '0.25rem', boxSizing: 'border-box' }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>추가 메모 (선택)</label>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="알레르기, 주의사항, 기타 전달 사항" rows={3}
              style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.95rem', marginTop: '0.25rem', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.75rem', padding: '0.85rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem' }}>
            {loading ? '접수 중...' : '투약 의뢰 접수'}
          </button>
        </form>
      </div>
    </div>
  );
}
