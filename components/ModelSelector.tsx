'use client';

import type { AIModel } from '../types';

const MODELS: { id: AIModel; name: string; badge: string; desc: string }[] = [
  { id: 'gemini-flash', name: 'Gemini Flash', badge: 'Google',    desc: '빠르고 저렴' },
  { id: 'claude-haiku', name: 'Claude Haiku', badge: 'Anthropic', desc: '정확한 문서' },
  { id: 'gpt-4o-mini',  name: 'GPT-4o mini',  badge: 'OpenAI',    desc: '자연스러운 문체' },
];

interface Props {
  value: AIModel;
  onChange: (m: AIModel) => void;
}

export default function ModelSelector({ value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
      {MODELS.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '2rem',
            border: value === m.id ? '2px solid #0d9488' : '1px solid #e2e8f0',
            background: value === m.id ? '#f0fdf4' : 'white',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: value === m.id ? 700 : 400,
            color: value === m.id ? '#0d9488' : '#64748b',
            transition: 'all 0.1s',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{m.badge}</span>
          {m.name}
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>· {m.desc}</span>
        </button>
      ))}
    </div>
  );
}
