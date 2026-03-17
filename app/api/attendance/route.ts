export const runtime = 'edge';
import { getD1, newId, nowIso, todayStr } from '../../../lib/d1';
import { requireAuth, requireAdmin, jsonOk, jsonErr } from '../../../lib/apiAuth';

export async function GET(req: Request) {
  try {
    const ctx = requireAuth(req);
    const db = getD1();
    const url = new URL(req.url);
    const centerId = url.searchParams.get('centerId') || ctx.centerId;
    const date = url.searchParams.get('date') || todayStr();

    const rows = await db
      .prepare(`
        SELECT a.*, c.name as child_name, c.class_name, c.parent_phone
        FROM attendance_records a
        LEFT JOIN children c ON a.child_id = c.id
        WHERE a.center_id = ? AND a.date = ?
        ORDER BY c.class_name, c.name
      `)
      .bind(centerId, date)
      .all();

    // Also get all children for this center (to show absent ones)
    const all = await db
      .prepare('SELECT id, name, class_name, parent_phone FROM children WHERE center_id = ? AND is_active = 1 ORDER BY class_name, name')
      .bind(centerId)
      .all();

    return jsonOk({ date, records: rows.results, children: all.results });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = requireAuth(req);
    const db = getD1();
    const body = await req.json() as {
      childId: string;
      type: 'in' | 'out';
      method?: 'qr' | 'nfc' | 'manual';
      centerId?: string;
      note?: string;
    };

    const centerId = body.centerId || ctx.centerId;
    const date = todayStr();
    const now = nowIso();

    // Check if record exists for today
    const existing = await db
      .prepare('SELECT * FROM attendance_records WHERE center_id = ? AND child_id = ? AND date = ?')
      .bind(centerId, body.childId, date)
      .first<{ id: string; check_in: string; check_out: string }>();

    if (existing) {
      // Update check-in or check-out
      if (body.type === 'in') {
        await db
          .prepare('UPDATE attendance_records SET check_in = ?, method = ? WHERE id = ?')
          .bind(now, body.method || 'manual', existing.id)
          .run();
      } else {
        await db
          .prepare('UPDATE attendance_records SET check_out = ? WHERE id = ?')
          .bind(now, existing.id)
          .run();
      }
      return jsonOk({ id: existing.id, updated: true });
    } else {
      const id = newId();
      await db
        .prepare(`INSERT INTO attendance_records (id, center_id, child_id, date, check_in, check_out, method, note, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, centerId, body.childId, date,
          body.type === 'in' ? now : null,
          body.type === 'out' ? now : null,
          body.method || 'manual',
          body.note || null,
          now)
        .run();
      return jsonOk({ id, created: true }, 201);
    }
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}
