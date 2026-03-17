export const runtime = 'edge';
import { getD1, nowIso } from '../../../../lib/d1';
import { requireAuth, jsonOk, jsonErr } from '../../../../lib/apiAuth';

export async function POST(req: Request) {
  try {
    requireAuth(req);
    const db = getD1();
    const body = await req.json() as { bookingId: string; notes: string };
    if (!body.bookingId || !body.notes) return jsonErr('bookingId and notes required');

    const env = (globalThis as unknown as { process?: { env: Record<string, string> } }).process?.env ?? {};
    const geminiKey = env.GEMINI_API_KEY;

    if (!geminiKey) {
      return jsonErr('AI not configured', 503);
    }

    const prompt = `다음 상담 내용을 학부모 보관용 요약으로 정리해주세요.\n\n[상담 내용]\n${body.notes}\n\n[지침]\n- 상담 주요 내용, 논의된 사항, 합의된 내용, 후속 조치 형식\n- 따뜻하고 전문적인 어조\n- 300자 이내로 간결하게\n- 완성된 요약만 출력`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    const data = await res.json() as { candidates?: { content?: { parts?: { text: string }[] } }[] };
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (summary) {
      await db
        .prepare('UPDATE consultation_bookings SET summary = ? WHERE id = ?')
        .bind(summary, body.bookingId)
        .run();
    }

    return jsonOk({ summary });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 500);
  }
}
