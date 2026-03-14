'use client';

import { useState } from 'react';
import type { AIModel } from '../types';

export function useAI() {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async (prompt: string, model: AIModel = 'gemini-flash') => {
    setOutput('');
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) throw new Error('AI 응답 오류');
      if (!res.body) throw new Error('스트림 없음');

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const obj = JSON.parse(line.slice(6));
            if (obj.text) setOutput((prev) => prev + obj.text);
            if (obj.error) setError(obj.error);
          } catch { /* skip */ }
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류 발생');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (output) navigator.clipboard.writeText(output);
  };

  return { output, loading, error, generate, copy, setOutput };
}
