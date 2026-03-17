export const runtime = 'edge';
import { getD1, newId, nowIso } from '../../../lib/d1';
import { requireAuth, requireAdmin, jsonOk, jsonErr } from '../../../lib/apiAuth';
import type { ConsultationSlot, ConsultationBooking } from '../../../types/ops';

export async function GET(req: Request) {
  try {
    const ctx = requireAuth(req);
    const db = getD1();
    const url = new URL(req.url);
    const centerId = url.searchParams.get('centerId') || ctx.centerId;
    const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);

    const slots = await db
      .prepare(`SELECT s.*, b.id as booking_id, b.child_name, b.parent_name, b.parent_phone, b.topic, b.status as booking_status, b.notes, b.summary
                FROM consultation_slots s
                LEFT JOIN consultation_bookings b ON s.id = b.slot_id AND b.status != 'cancelled'
                WHERE s.center_id = ? AND s.slot_date >= ? AND s.slot_date <= ?
                ORDER BY s.slot_date, s.slot_time`)
      .bind(centerId, `${month}-01`, `${month}-31`)
      .all();

    return jsonOk(slots.results);
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}

// Admin creates available slots
export async function POST(req: Request) {
  try {
    const ctx = requireAdmin(req);
    const db = getD1();
    const body = await req.json() as {
      centerId?: string;
      teacherName?: string;
      slots: { date: string; time: string; durationMinutes?: number }[];
    };

    const centerId = body.centerId || ctx.centerId;
    const ids: string[] = [];

    for (const slot of body.slots) {
      const id = newId();
      await db
        .prepare(`INSERT INTO consultation_slots (id, center_id, teacher_uid, teacher_name, slot_date, slot_time, duration_minutes, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, centerId, ctx.userUid || 'admin', body.teacherName || ctx.userName || null,
          slot.date, slot.time, slot.durationMinutes ?? 30, nowIso())
        .run();
      ids.push(id);
    }

    return jsonOk({ created: ids.length, ids }, 201);
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}
