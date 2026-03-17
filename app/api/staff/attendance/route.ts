export const runtime = 'edge';
import { getD1, newId, nowIso, todayStr, yearMonthStr } from '../../../../lib/d1';
import { requireAuth, requireAdmin, jsonOk, jsonErr } from '../../../../lib/apiAuth';
import type { StaffAttendance } from '../../../../types/ops';

export async function GET(req: Request) {
  try {
    const ctx = requireAdmin(req);
    const db = getD1();
    const url = new URL(req.url);
    const centerId = url.searchParams.get('centerId') || ctx.centerId;
    const month = url.searchParams.get('month') || yearMonthStr();

    const rows = await db
      .prepare(`SELECT * FROM staff_attendance
                WHERE center_id = ? AND date >= ? AND date <= ?
                ORDER BY date DESC, user_name`)
      .bind(centerId, `${month}-01`, `${month}-31`)
      .all<StaffAttendance>();

    // Group by user
    const byUser = new Map<string, StaffAttendance[]>();
    for (const r of rows.results) {
      if (!byUser.has(r.user_uid)) byUser.set(r.user_uid, []);
      byUser.get(r.user_uid)!.push(r);
    }

    const summary = Array.from(byUser.entries()).map(([uid, records]) => {
      let totalMinutes = 0;
      let lateDays = 0;
      for (const r of records) {
        if (r.clock_in && r.clock_out) {
          const inMs = new Date(r.clock_in).getTime();
          const outMs = new Date(r.clock_out).getTime();
          totalMinutes += Math.max(0, (outMs - inMs) / 60000 - r.break_minutes);
        }
        if (r.late_minutes > 0) lateDays++;
      }
      return {
        user_uid: uid,
        user_name: records[0]?.user_name,
        work_days: records.filter((r) => r.clock_in).length,
        total_hours: Math.round(totalMinutes / 60 * 10) / 10,
        late_days: lateDays,
      };
    });

    return jsonOk({ month, records: rows.results, summary });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = requireAuth(req);
    const db = getD1();
    const body = await req.json() as { type: 'in' | 'out'; centerId?: string };
    const centerId = body.centerId || ctx.centerId;
    const date = todayStr();
    const now = nowIso();

    const existing = await db
      .prepare('SELECT * FROM staff_attendance WHERE center_id = ? AND user_uid = ? AND date = ?')
      .bind(centerId, ctx.userUid, date)
      .first<StaffAttendance>();

    if (existing) {
      if (body.type === 'in') {
        await db.prepare('UPDATE staff_attendance SET clock_in = ? WHERE id = ?').bind(now, existing.id).run();
      } else {
        await db.prepare('UPDATE staff_attendance SET clock_out = ? WHERE id = ?').bind(now, existing.id).run();
      }
      return jsonOk({ id: existing.id, updated: true });
    }

    const id = newId();
    await db
      .prepare(`INSERT INTO staff_attendance (id, center_id, user_uid, user_name, date, clock_in, clock_out, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, centerId, ctx.userUid, ctx.userName ?? null, date,
        body.type === 'in' ? now : null,
        body.type === 'out' ? now : null,
        now)
      .run();

    return jsonOk({ id, created: true }, 201);
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}
