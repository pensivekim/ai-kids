export const runtime = 'edge';
import { getD1 } from '../../../lib/d1';
import { requireAuth, requireAdmin, jsonOk, jsonErr } from '../../../lib/apiAuth';

// GET/PATCH children's allergen profiles
export async function GET(req: Request) {
  try {
    const ctx = requireAuth(req);
    const db = getD1();
    const url = new URL(req.url);
    const centerId = url.searchParams.get('centerId') || ctx.centerId;

    const rows = await db
      .prepare(`SELECT id, name, class_name, allergies FROM children
                WHERE center_id = ? AND is_active = 1
                ORDER BY class_name, name`)
      .bind(centerId)
      .all<{ id: string; name: string; class_name: string; allergies: string }>();

    const children = rows.results.map((c: { id: string; name: string; class_name: string; allergies: string }) => ({
      ...c,
      allergies: JSON.parse(c.allergies || '[]') as string[],
    }));

    return jsonOk(children);
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}

export async function PATCH(req: Request) {
  try {
    requireAdmin(req);
    const db = getD1();
    const body = await req.json() as { id: string; allergies: string[] };
    if (!body.id) return jsonErr('id required');

    await db
      .prepare('UPDATE children SET allergies = ? WHERE id = ?')
      .bind(JSON.stringify(body.allergies), body.id)
      .run();

    return jsonOk({ ok: true });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}
