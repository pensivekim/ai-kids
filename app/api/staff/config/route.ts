export const runtime = 'edge';
import { getD1, newId, nowIso } from '../../../../lib/d1';
import { requireAdmin, jsonOk, jsonErr } from '../../../../lib/apiAuth';
import type { StaffConfig } from '../../../../types/ops';

export async function GET(req: Request) {
  try {
    const ctx = requireAdmin(req);
    const db = getD1();
    const url = new URL(req.url);
    const centerId = url.searchParams.get('centerId') || ctx.centerId;

    const rows = await db
      .prepare('SELECT * FROM staff_config WHERE center_id = ? AND is_active = 1 ORDER BY user_name')
      .bind(centerId)
      .all<StaffConfig>();

    return jsonOk(rows.results);
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = requireAdmin(req);
    const db = getD1();
    const body = await req.json() as Partial<StaffConfig> & { centerId?: string };
    const centerId = body.centerId || ctx.centerId;

    if (!body.user_uid) return jsonErr('user_uid required');

    const id = newId();
    await db
      .prepare(`INSERT OR REPLACE INTO staff_config
                (id, center_id, user_uid, user_name, position, employment_type, base_salary, hourly_wage, work_hours_per_day, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`)
      .bind(id, centerId, body.user_uid, body.user_name ?? null,
        body.position ?? null,
        body.employment_type ?? 'full',
        body.base_salary ?? 0,
        body.hourly_wage ?? 0,
        body.work_hours_per_day ?? 8.0)
      .run();

    return jsonOk({ id }, 201);
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}
