export const runtime = 'edge';
import { getD1, newId, nowIso, todayStr } from '../../../../lib/d1';
import { requireAuth, requireAdmin, jsonOk, jsonErr } from '../../../../lib/apiAuth';
import type { MealItem } from '../../../../types/ops';

export async function GET(req: Request) {
  try {
    const ctx = requireAuth(req);
    const db = getD1();
    const url = new URL(req.url);
    const centerId = url.searchParams.get('centerId') || ctx.centerId;
    const date = url.searchParams.get('date') || todayStr();

    const menus = await db
      .prepare('SELECT * FROM meal_menus WHERE center_id = ? AND menu_date = ?')
      .bind(centerId, date)
      .all<{ id: string; meal_type: string; items: string }>();

    const alerts = await db
      .prepare(`SELECT a.*, c.name as child_name, c.class_name
                FROM meal_allergy_alerts a
                LEFT JOIN children c ON a.child_id = c.id
                WHERE a.center_id = ? AND a.created_at >= ?
                ORDER BY c.class_name, c.name`)
      .bind(centerId, `${date}T00:00:00.000Z`)
      .all();

    return jsonOk({
      date,
      menus: menus.results.map((m: { id: string; meal_type: string; items: string }) => ({ ...m, items: JSON.parse(m.items) as MealItem[] })),
      alerts: alerts.results,
    });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = requireAdmin(req);
    const db = getD1();
    const body = await req.json() as {
      centerId?: string;
      menuDate: string;
      mealType: string;
      items: MealItem[];
    };

    const centerId = body.centerId || ctx.centerId;
    const menuId = newId();

    // Save menu
    await db
      .prepare('INSERT OR REPLACE INTO meal_menus (id, center_id, menu_date, meal_type, items, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(menuId, centerId, body.menuDate, body.mealType || 'lunch', JSON.stringify(body.items), nowIso())
      .run();

    // Auto-generate allergy alerts
    const children = await db
      .prepare('SELECT id, name, allergies FROM children WHERE center_id = ? AND is_active = 1')
      .bind(centerId)
      .all<{ id: string; name: string; allergies: string }>();

    let alertCount = 0;
    for (const child of children.results) {
      const childAllergies: string[] = JSON.parse(child.allergies || '[]');
      if (childAllergies.length === 0) continue;

      for (const item of body.items) {
        for (const allergen of item.allergens) {
          if (childAllergies.includes(allergen)) {
            await db
              .prepare(`INSERT INTO meal_allergy_alerts (id, center_id, child_id, menu_id, allergen, meal_item, notified_at, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
              .bind(newId(), centerId, child.id, menuId, allergen, item.name, nowIso(), nowIso())
              .run();
            alertCount++;
          }
        }
      }
    }

    return jsonOk({ menuId, alertCount }, 201);
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}
