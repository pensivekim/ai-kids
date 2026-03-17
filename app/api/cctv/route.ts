export const runtime = 'edge';
import { getD1, newId, nowIso } from '../../../lib/d1';
import { requireAdmin, jsonOk, jsonErr } from '../../../lib/apiAuth';
import type { CctvRequest } from '../../../types/ops';

export async function GET(req: Request) {
  try {
    const ctx = requireAdmin(req);
    const db = getD1();
    const url = new URL(req.url);
    const centerId = url.searchParams.get('centerId') || ctx.centerId;
    const status = url.searchParams.get('status');

    const query = status
      ? 'SELECT * FROM cctv_requests WHERE center_id = ? AND status = ? ORDER BY created_at DESC'
      : 'SELECT * FROM cctv_requests WHERE center_id = ? ORDER BY created_at DESC';

    const rows = status
      ? await db.prepare(query).bind(centerId, status).all<CctvRequest>()
      : await db.prepare(query).bind(centerId).all<CctvRequest>();

    // Auto-expire overdue approved requests
    const now = new Date().toISOString();
    await db
      .prepare(`UPDATE cctv_requests SET status = 'expired'
                WHERE center_id = ? AND status = 'approved' AND view_deadline < ?`)
      .bind(centerId, now)
      .run();

    return jsonOk(rows.results);
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}

// Public: parent submits request
export async function POST(req: Request) {
  try {
    const db = getD1();
    const body = await req.json() as Partial<CctvRequest> & { centerId: string };

    if (!body.centerId || !body.requester_name || !body.requester_phone || !body.child_name || !body.requested_date || !body.reason) {
      return jsonErr('required fields missing');
    }

    const id = newId();
    await db
      .prepare(`INSERT INTO cctv_requests
                (id, center_id, requester_name, requester_phone, requester_relation, child_name,
                 requested_date, requested_time_from, requested_time_to, reason, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, body.centerId, body.requester_name, body.requester_phone,
        body.requester_relation ?? '부모',
        body.child_name, body.requested_date,
        body.requested_time_from ?? null, body.requested_time_to ?? null,
        body.reason, nowIso())
      .run();

    return jsonOk({ id }, 201);
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = requireAdmin(req);
    const db = getD1();
    const body = await req.json() as {
      id: string;
      status: CctvRequest['status'];
      reviewNote?: string;
      viewDeadlineDays?: number;  // approved 시 열람 기한 (일)
    };
    if (!body.id) return jsonErr('id required');

    let viewDeadline: string | null = null;
    if (body.status === 'approved') {
      const days = body.viewDeadlineDays ?? 7;
      const d = new Date();
      d.setDate(d.getDate() + days);
      viewDeadline = d.toISOString();
    }

    await db
      .prepare(`UPDATE cctv_requests
                SET status = ?, reviewed_by = ?, review_note = ?, view_deadline = ?
                WHERE id = ?`)
      .bind(body.status,
        ctx.userName || ctx.userUid || null,
        body.reviewNote ?? null,
        viewDeadline,
        body.id)
      .run();

    return jsonOk({ ok: true, view_deadline: viewDeadline });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}
