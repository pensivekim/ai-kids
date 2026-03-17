export const runtime = 'edge';
import { getD1, newId, nowIso, yearMonthStr } from '../../../../lib/d1';
import { requireAdmin, jsonOk, jsonErr } from '../../../../lib/apiAuth';
import type { PayrollRecord, StaffConfig } from '../../../../types/ops';

export async function GET(req: Request) {
  try {
    const ctx = requireAdmin(req);
    const db = getD1();
    const url = new URL(req.url);
    const centerId = url.searchParams.get('centerId') || ctx.centerId;
    const month = url.searchParams.get('month') || yearMonthStr();

    const rows = await db
      .prepare('SELECT * FROM payroll_records WHERE center_id = ? AND year_month = ? ORDER BY user_name')
      .bind(centerId, month)
      .all<PayrollRecord>();

    return jsonOk({ month, records: rows.results });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}

// Compute payroll from attendance data
export async function POST(req: Request) {
  try {
    const ctx = requireAdmin(req);
    const db = getD1();
    const body = await req.json() as { centerId?: string; month?: string };
    const centerId = body.centerId || ctx.centerId;
    const month = body.month || yearMonthStr();

    // Get staff configs
    const configs = await db
      .prepare('SELECT * FROM staff_config WHERE center_id = ? AND is_active = 1')
      .bind(centerId)
      .all<StaffConfig>();

    if (configs.results.length === 0) {
      return jsonErr('No staff config found. Please set up staff salaries first.');
    }

    // Get attendance for month
    const attendance = await db
      .prepare(`SELECT user_uid, user_name, date, clock_in, clock_out, break_minutes, late_minutes
                FROM staff_attendance WHERE center_id = ? AND date >= ? AND date <= ?`)
      .bind(centerId, `${month}-01`, `${month}-31`)
      .all<{ user_uid: string; user_name: string; date: string; clock_in: string; clock_out: string; break_minutes: number; late_minutes: number }>();

    // Group by user
    const attByUser = new Map<string, typeof attendance.results>();
    for (const r of attendance.results) {
      if (!attByUser.has(r.user_uid)) attByUser.set(r.user_uid, []);
      attByUser.get(r.user_uid)!.push(r);
    }

    const payrolls: string[] = [];
    for (const cfg of configs.results) {
      const records = attByUser.get(cfg.user_uid) ?? [];
      let totalMinutes = 0;
      let workDays = 0;
      let lateDays = 0;

      for (const r of records) {
        if (r.clock_in) workDays++;
        if (r.clock_in && r.clock_out) {
          const mins = (new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime()) / 60000;
          totalMinutes += Math.max(0, mins - r.break_minutes);
        }
        if (r.late_minutes > 0) lateDays++;
      }

      const totalHours = totalMinutes / 60;
      let basePay = cfg.base_salary;
      let overtimePay = 0;

      if (cfg.employment_type === 'part' && cfg.hourly_wage > 0) {
        basePay = Math.round(totalHours * cfg.hourly_wage);
        const expectedHours = workDays * cfg.work_hours_per_day;
        const overtimeHours = Math.max(0, totalHours - expectedHours);
        overtimePay = Math.round(overtimeHours * cfg.hourly_wage * 1.5);
      }

      const deductions = Math.round(lateDays * (basePay / 30) * 0.1);
      const netPay = basePay + overtimePay - deductions;

      // Upsert payroll record
      const id = newId();
      await db
        .prepare(`INSERT OR REPLACE INTO payroll_records
                  (id, center_id, user_uid, user_name, year_month, base_salary, hourly_wage,
                   overtime_pay, deductions, net_pay, work_days, total_hours, late_count, status, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`)
        .bind(id, centerId, cfg.user_uid, cfg.user_name ?? null, month,
          basePay, cfg.hourly_wage, overtimePay, deductions, netPay,
          workDays, Math.round(totalHours * 10) / 10, lateDays, nowIso())
        .run();
      payrolls.push(id);
    }

    return jsonOk({ computed: payrolls.length, month });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 500);
  }
}

export async function PATCH(req: Request) {
  try {
    requireAdmin(req);
    const db = getD1();
    const body = await req.json() as { id: string; status: PayrollRecord['status']; notes?: string };
    if (!body.id) return jsonErr('id required');

    await db
      .prepare('UPDATE payroll_records SET status = ?, notes = ? WHERE id = ?')
      .bind(body.status, body.notes ?? null, body.id)
      .run();

    return jsonOk({ ok: true });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}
