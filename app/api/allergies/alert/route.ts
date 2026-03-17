export const runtime = 'edge';
import { getD1, nowIso } from '../../../../lib/d1';
import { requireAuth, jsonOk, jsonErr } from '../../../../lib/apiAuth';

export async function GET(req: Request) {
  try {
    const ctx = requireAuth(req);
    const db = getD1();
    const url = new URL(req.url);
    const centerId = url.searchParams.get('centerId') || ctx.centerId;
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    const alerts = await db
      .prepare(`SELECT a.*, c.name as child_name, c.class_name
                FROM meal_allergy_alerts a
                LEFT JOIN children c ON a.child_id = c.id
                WHERE a.center_id = ? AND DATE(a.created_at) = ?
                ORDER BY a.acknowledged_at ASC, c.class_name, c.name`)
      .bind(centerId, date)
      .all();

    const unacknowledged = alerts.results.filter((a) => !(a as Record<string, unknown>).acknowledged_at).length;

    return jsonOk({ date, alerts: alerts.results, unacknowledged });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = requireAuth(req);
    const db = getD1();
    const body = await req.json() as { alertId: string };
    if (!body.alertId) return jsonErr('alertId required');

    await db
      .prepare('UPDATE meal_allergy_alerts SET acknowledged_by = ?, acknowledged_at = ? WHERE id = ?')
      .bind(ctx.userName || ctx.userUid || 'teacher', nowIso(), body.alertId)
      .run();

    return jsonOk({ ok: true });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}
