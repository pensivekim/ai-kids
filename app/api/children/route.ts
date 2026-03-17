export const runtime = 'edge';
import { getD1, newId, nowIso } from '../../../lib/d1';
import { requireAuth, requireAdmin, jsonOk, jsonErr } from '../../../lib/apiAuth';
import type { Child } from '../../../types/ops';

export async function GET(req: Request) {
  try {
    const ctx = requireAuth(req);
    const db = getD1();
    const url = new URL(req.url);
    const centerId = url.searchParams.get('centerId') || ctx.centerId;

    const rows = await db
      .prepare('SELECT * FROM children WHERE center_id = ? AND is_active = 1 ORDER BY class_name, name')
      .bind(centerId)
      .all<Child>();

    const children = rows.results.map((c: Child) => ({
      ...c,
      allergies: JSON.parse((c.allergies as unknown as string) || '[]'),
    }));
    return jsonOk(children);
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = requireAdmin(req);
    const db = getD1();
    const body = await req.json() as Partial<Child> & { centerId?: string };
    const centerId = body.centerId || ctx.centerId;

    if (!body.name) return jsonErr('name required');

    const id = newId();
    await db
      .prepare(`INSERT INTO children (id, center_id, name, birth_date, class_name, parent_name, parent_phone, allergies, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, centerId, body.name, body.birth_date ?? null, body.class_name ?? null,
        body.parent_name ?? null, body.parent_phone ?? null,
        JSON.stringify(body.allergies ?? []), nowIso())
      .run();

    return jsonOk({ id }, 201);
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}

export async function PATCH(req: Request) {
  try {
    requireAdmin(req);
    const db = getD1();
    const body = await req.json() as Partial<Child> & { id: string };
    if (!body.id) return jsonErr('id required');

    await db
      .prepare(`UPDATE children SET name=?, birth_date=?, class_name=?, parent_name=?, parent_phone=?, allergies=? WHERE id=?`)
      .bind(body.name, body.birth_date ?? null, body.class_name ?? null,
        body.parent_name ?? null, body.parent_phone ?? null,
        JSON.stringify(body.allergies ?? []), body.id)
      .run();

    return jsonOk({ ok: true });
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

    await db.prepare('UPDATE children SET is_active = 0 WHERE id = ?').bind(id).run();
    return jsonOk({ ok: true });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}
