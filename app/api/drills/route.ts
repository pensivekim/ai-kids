export const runtime = 'edge';
import { getD1, newId, nowIso } from '../../../lib/d1';
import { requireAdmin, jsonOk, jsonErr } from '../../../lib/apiAuth';
import type { DrillRecord, DrillCompliance } from '../../../types/ops';

// 법정 최소 훈련 횟수 (영유아보육법 시행규칙 제23조)
const REQUIRED: Record<string, number> = {
  fire: 2,        // 연 2회 이상
  earthquake: 2,  // 연 2회 이상
  evacuation: 2,  // 연 2회 이상
};

export async function GET(req: Request) {
  try {
    const ctx = requireAdmin(req);
    const db = getD1();
    const url = new URL(req.url);
    const centerId = url.searchParams.get('centerId') || ctx.centerId;
    const year = url.searchParams.get('year') || String(new Date().getFullYear());

    const rows = await db
      .prepare(`SELECT * FROM drill_records
                WHERE center_id = ? AND drill_date >= ? AND drill_date <= ?
                ORDER BY drill_date DESC`)
      .bind(centerId, `${year}-01-01`, `${year}-12-31`)
      .all<DrillRecord>();

    // Compliance check
    const counts: Record<string, number> = { fire: 0, earthquake: 0, evacuation: 0, lockdown: 0 };
    for (const r of rows.results) {
      counts[r.drill_type] = (counts[r.drill_type] || 0) + 1;
    }

    const compliance: DrillCompliance = {
      year: Number(year),
      fire: counts.fire,
      earthquake: counts.earthquake,
      evacuation: counts.evacuation,
      fire_required: REQUIRED.fire,
      earthquake_required: REQUIRED.earthquake,
      evacuation_required: REQUIRED.evacuation,
      fire_ok: counts.fire >= REQUIRED.fire,
      earthquake_ok: counts.earthquake >= REQUIRED.earthquake,
      evacuation_ok: counts.evacuation >= REQUIRED.evacuation,
      all_ok: counts.fire >= REQUIRED.fire && counts.earthquake >= REQUIRED.earthquake && counts.evacuation >= REQUIRED.evacuation,
    };

    return jsonOk({ year, records: rows.results, compliance });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = requireAdmin(req);
    const db = getD1();
    const body = await req.json() as Partial<DrillRecord> & { centerId?: string };

    if (!body.drill_type || !body.drill_date) return jsonErr('drill_type and drill_date required');

    const id = newId();
    await db
      .prepare(`INSERT INTO drill_records
                (id, center_id, drill_type, drill_date, start_time, end_time,
                 participant_count, evacuation_time_seconds, scenario, findings, improvements, supervisor_name, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id,
        body.centerId || ctx.centerId,
        body.drill_type, body.drill_date,
        body.start_time ?? null, body.end_time ?? null,
        body.participant_count ?? null, body.evacuation_time_seconds ?? null,
        body.scenario ?? null, body.findings ?? null,
        body.improvements ?? null, body.supervisor_name ?? null,
        nowIso())
      .run();

    return jsonOk({ id }, 201);
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}

export async function DELETE(req: Request) {
  try {
    requireAdmin(req);
    const db = getD1();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return jsonErr('id required');
    await db.prepare('DELETE FROM drill_records WHERE id = ?').bind(id).run();
    return jsonOk({ ok: true });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}
