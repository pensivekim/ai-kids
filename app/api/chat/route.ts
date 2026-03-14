export const runtime = 'edge';

import type { AIModel } from '../../../types';

const CF_ACCOUNT = 'f6c784dae2ac774f3f877b4ba39a88d6';
const GW = `https://gateway.ai.cloudflare.com/v1/${CF_ACCOUNT}/carebot`;

const MODEL_ID: Record<AIModel, string> = {
  'claude-haiku':  'claude-haiku-4-5-20251001',
  'claude-sonnet': 'claude-sonnet-4-5',
  'gpt-4o-mini':   'gpt-4o-mini',
  'gemini-flash':  'gemini-2.0-flash',
};

interface Msg { role: string; content: string; }
type Ctrl = ReadableStreamDefaultController;
type SendFn = (ctrl: Ctrl, data: object) => void;

export async function POST(req: Request) {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const hasRole = cookieHeader.includes('kids_role=');
  if (!hasRole) {
    return new Response(JSON.stringify({ error: '로그인이 필요합니다.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { model, messages, systemPrompt } = await req.json() as {
    model: AIModel;
    messages: Msg[];
    systemPrompt?: string;
  };

  const modelId = MODEL_ID[model] ?? 'gemini-2.0-flash';
  const allMessages: Msg[] = systemPrompt
    ? [{ role: 'user', content: systemPrompt }, ...messages]
    : messages;

  const enc = new TextEncoder();
  const send: SendFn = (ctrl, data) => {
    ctrl.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  const stream = new ReadableStream({
    async start(ctrl) {
      try {
        if (model.startsWith('claude')) {
          await streamClaude(ctrl, send, modelId, allMessages);
        } else if (model.startsWith('gpt')) {
          await streamOpenAI(ctrl, send, modelId, allMessages);
        } else {
          await streamGemini(ctrl, send, modelId, allMessages);
        }
      } catch (e: unknown) {
        send(ctrl, { error: e instanceof Error ? e.message : String(e) });
      }
      ctrl.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function streamClaude(ctrl: Ctrl, send: SendFn, modelId: string, messages: Msg[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { send(ctrl, { error: 'ANTHROPIC_API_KEY 미설정' }); return; }

  const res = await fetch(`${GW}/anthropic/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model: modelId, max_tokens: 4096, messages, stream: true }),
  });

  if (!res.ok) { send(ctrl, { error: `Claude 오류: ${await res.text()}` }); return; }

  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let tokens = 0;

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
        if (obj.type === 'content_block_delta' && obj.delta?.type === 'text_delta') {
          send(ctrl, { text: obj.delta.text });
        }
        if (obj.type === 'message_delta' && obj.usage?.output_tokens) {
          tokens = obj.usage.output_tokens;
        }
        if (obj.type === 'message_stop') {
          send(ctrl, { done: true, tokens });
        }
      } catch { /* skip */ }
    }
  }
}

async function streamOpenAI(ctrl: Ctrl, send: SendFn, modelId: string, messages: Msg[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) { send(ctrl, { error: 'OPENAI_API_KEY 미설정' }); return; }

  const res = await fetch(`${GW}/openai/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      stream: true,
      stream_options: { include_usage: true },
    }),
  });

  if (!res.ok) { send(ctrl, { error: `OpenAI 오류: ${await res.text()}` }); return; }

  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let tokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') { send(ctrl, { done: true, tokens }); continue; }
      try {
        const obj = JSON.parse(json);
        const text = obj.choices?.[0]?.delta?.content;
        if (text) send(ctrl, { text });
        if (obj.usage?.completion_tokens) tokens = obj.usage.completion_tokens;
      } catch { /* skip */ }
    }
  }
}

async function streamGemini(ctrl: Ctrl, send: SendFn, modelId: string, messages: Msg[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { send(ctrl, { error: 'GEMINI_API_KEY 미설정' }); return; }

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const url = `${GW}/google-ai-studio/v1beta/models/${modelId}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ contents }),
  });

  if (!res.ok) { send(ctrl, { error: `Gemini 오류: ${await res.text()}` }); return; }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    usageMetadata?: { candidatesTokenCount?: number };
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (text) send(ctrl, { text });
  send(ctrl, { done: true, tokens: data.usageMetadata?.candidatesTokenCount ?? 0 });
}
