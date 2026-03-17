export const runtime = 'edge';
import { getD1, newId, nowIso, todayStr } from '../../../lib/d1';
import { requireAuth, jsonOk, jsonErr } from '../../../lib/apiAuth';
import type { MedicationRequest } from '../../../types/ops';

export async function GET(req: Request) {
  try {
    const ctx = requireAuth(req);
    const db = getD1();
    const url = new URL(req.url);
    const centerId = url.searchParams.get('centerId') || ctx.centerId;
    const date = url.searchParams.get('date') || todayStr();

    const rows = await db
      .prepare('SELECT * FROM medication_requests WHERE center_id = ? AND date = ? ORDER BY created_at DESC')
      .bind(centerId, date)
      .all<MedicationRequest>();

    return jsonOk(rows.results);
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}

export async function POST(req: Request) {
  try {
    const db = getD1();
    const body = await req.json() as Partial<MedicationRequest> & { centerId: string };

    if (!body.centerId || !body.child_name || !body.drug_name || !body.dosage || !body.timing || !body.requested_by) {
      return jsonErr('required fields missing');
    }

    const id = newId();
    const childId = body.child_id || id; // allow anonymous (no child record)

    await db
      .prepare(`INSERT INTO medication_requests
                (id, center_id, child_id, child_name, requested_by, requester_phone, date, drug_name, dosage, timing, note, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, body.centerId, childId, body.child_name,
        body.requested_by, body.requester_phone ?? null,
        body.date || todayStr(),
        body.drug_name, body.dosage, body.timing,
        body.note ?? null, nowIso())
      .run();

    return jsonOk({ id }, 201);
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = requireAuth(req);
    const db = getD1();
    const body = await req.json() as {
      id: string;
      status: MedicationRequest['status'];
      signatureData?: string;
      note?: string;
    };
    if (!body.id) return jsonErr('id required');

    await db
      .prepare(`UPDATE medication_requests
                SET status = ?, confirmed_by = ?, confirmed_at = ?, signature_data = ?
                WHERE id = ?`)
      .bind(body.status,
        ctx.userName || ctx.userUid || null,
        body.status === 'confirmed' || body.status === 'completed' ? nowIso() : null,
        body.signatureData ?? null,
        body.id)
      .run();

    return jsonOk({ ok: true });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}
