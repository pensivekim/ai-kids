'use client';
import type { AIModel } from '../types';

const MODELS: { value: AIModel; label: string }[] = [
  { value: 'gemini-flash', label: 'Gemini Flash' },
  { value: 'claude-haiku', label: 'Claude Haiku' },
  { value: 'gpt-4o-mini', label: 'GPT-4o mini' },
];

interface Props {
  value: AIModel;
  onChange: (model: AIModel) => void;
}

export default function ModelSelector({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as AIModel)}
      style={{ border: '1px solid #e2e8f0', borderRadius: '0.4rem', padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#64748b', background: 'white', cursor: 'pointer' }}
    >
      {MODELS.map((m) => (
        <option key={m.value} value={m.value}>{m.label}</option>
      ))}
    </select>
  );
}
