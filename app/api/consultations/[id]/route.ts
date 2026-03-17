export const runtime = 'edge';
import { getD1, newId, nowIso } from '../../../../lib/d1';
import { requireAuth, jsonOk, jsonErr } from '../../../../lib/apiAuth';

// Book a slot (public - no auth required for parent booking)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getD1();
    const { id: slotId } = await params;
    const body = await req.json() as {
      childName: string;
      parentName: string;
      parentPhone: string;
      topic?: string;
      centerId: string;
    };

    if (!body.childName || !body.parentName || !body.parentPhone) {
      return jsonErr('childName, parentName, parentPhone required');
    }

    // Check slot availability
    const slot = await db
      .prepare('SELECT * FROM consultation_slots WHERE id = ? AND is_available = 1')
      .bind(slotId)
      .first();

    if (!slot) return jsonErr('Slot not available', 404);

    // Check no existing booking
    const existing = await db
      .prepare("SELECT id FROM consultation_bookings WHERE slot_id = ? AND status != 'cancelled'")
      .bind(slotId)
      .first();

    if (existing) return jsonErr('Slot already booked', 409);

    const bookingId = newId();
    await db
      .prepare(`INSERT INTO consultation_bookings (id, slot_id, center_id, child_name, parent_name, parent_phone, topic, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(bookingId, slotId, body.centerId, body.childName, body.parentName, body.parentPhone, body.topic ?? null, nowIso())
      .run();

    await db.prepare('UPDATE consultation_slots SET is_available = 0 WHERE id = ?').bind(slotId).run();

    return jsonOk({ bookingId }, 201);
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 500);
  }
}

// Teacher updates after consultation (notes, status)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(req);
    const db = getD1();
    const { id: bookingId } = await params;
    const body = await req.json() as {
      status?: 'cancelled' | 'completed';
      notes?: string;
    };

    await db
      .prepare('UPDATE consultation_bookings SET status = ?, notes = ? WHERE id = ?')
      .bind(body.status ?? 'completed', body.notes ?? null, bookingId)
      .run();

    // Free the slot if cancelled
    if (body.status === 'cancelled') {
      const booking = await db
        .prepare('SELECT slot_id FROM consultation_bookings WHERE id = ?')
        .bind(bookingId)
        .first<{ slot_id: string }>();
      if (booking) {
        await db.prepare('UPDATE consultation_slots SET is_available = 1 WHERE id = ?').bind(booking.slot_id).run();
      }
    }

    return jsonOk({ ok: true });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}
