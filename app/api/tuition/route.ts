export const runtime = 'edge';
import { getD1, newId, nowIso, yearMonthStr } from '../../../lib/d1';
import { requireAdmin, jsonOk, jsonErr } from '../../../lib/apiAuth';
import type { TuitionAccount } from '../../../types/ops';

export async function GET(req: Request) {
  try {
    const ctx = requireAdmin(req);
    const db = getD1();
    const url = new URL(req.url);
    const centerId = url.searchParams.get('centerId') || ctx.centerId;
    const month = url.searchParams.get('month') || yearMonthStr();

    const rows = await db
      .prepare(`
        SELECT t.*, c.name as child_name, c.class_name, c.parent_phone
        FROM tuition_accounts t
        LEFT JOIN children c ON t.child_id = c.id
        WHERE t.center_id = ? AND t.year_month = ?
        ORDER BY c.class_name, c.name
      `)
      .bind(centerId, month)
      .all();

    const summary = await db
      .prepare(`SELECT status, COUNT(*) as count, SUM(net_amount) as total
                FROM tuition_accounts WHERE center_id = ? AND year_month = ?
                GROUP BY status`)
      .bind(centerId, month)
      .all();

    return jsonOk({ month, accounts: rows.results, summary: summary.results });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}

// Create billing for a month (bulk or single)
export async function POST(req: Request) {
  try {
    const ctx = requireAdmin(req);
    const db = getD1();
    const body = await req.json() as {
      centerId?: string;
      month?: string;
      childId?: string;
      baseAmount: number;
      subsidyAmount?: number;
      dueDate?: string;
      bulkAll?: boolean;  // true = create for all active children
    };

    const centerId = body.centerId || ctx.centerId;
    const month = body.month || yearMonthStr();
    const subsidy = body.subsidyAmount ?? 0;
    const net = body.baseAmount - subsidy;

    if (body.bulkAll) {
      // Create bills for all active children who don't have one yet
      const children = await db
        .prepare('SELECT id FROM children WHERE center_id = ? AND is_active = 1')
        .bind(centerId)
        .all<{ id: string }>();

      const existing = await db
        .prepare('SELECT child_id FROM tuition_accounts WHERE center_id = ? AND year_month = ?')
        .bind(centerId, month)
        .all<{ child_id: string }>();

      const existingSet = new Set(existing.results.map((r) => r.child_id));
      const toCreate = children.results.filter((c) => !existingSet.has(c.id));

      const ids: string[] = [];
      for (const child of toCreate) {
        const id = newId();
        await db
          .prepare(`INSERT INTO tuition_accounts (id, center_id, child_id, year_month, base_amount, subsidy_amount, net_amount, due_date, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(id, centerId, child.id, month, body.baseAmount, subsidy, net, body.dueDate ?? null, nowIso())
          .run();
        ids.push(id);
      }
      return jsonOk({ created: ids.length, ids }, 201);
    }

    if (!body.childId) return jsonErr('childId required');

    const id = newId();
    await db
      .prepare(`INSERT OR REPLACE INTO tuition_accounts (id, center_id, child_id, year_month, base_amount, subsidy_amount, net_amount, due_date, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, centerId, body.childId, month, body.baseAmount, subsidy, net, body.dueDate ?? null, nowIso())
      .run();

    return jsonOk({ id }, 201);
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}

// Update status (manual override: cash payment, waive, etc.)
export async function PATCH(req: Request) {
  try {
    requireAdmin(req);
    const db = getD1();
    const body = await req.json() as { id: string; status: TuitionAccount['status']; paidAt?: string };
    if (!body.id) return jsonErr('id required');

    await db
      .prepare('UPDATE tuition_accounts SET status = ?, paid_at = ? WHERE id = ?')
      .bind(body.status, body.paidAt ?? (body.status === 'paid' ? nowIso() : null), body.id)
      .run();

    // Record cash payment
    if (body.status === 'paid') {
      const account = await db
        .prepare('SELECT * FROM tuition_accounts WHERE id = ?')
        .bind(body.id)
        .first<TuitionAccount>();
      if (account) {
        await db
          .prepare('INSERT INTO tuition_payments (id, account_id, amount, method, created_at) VALUES (?, ?, ?, ?, ?)')
          .bind(newId(), body.id, account.net_amount, 'cash', nowIso())
          .run();
      }
    }

    return jsonOk({ ok: true });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}
