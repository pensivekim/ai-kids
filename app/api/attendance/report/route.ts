export const runtime = 'edge';
import { getD1 } from '../../../../lib/d1';
import { requireAdmin, jsonOk, jsonErr } from '../../../../lib/apiAuth';

export async function GET(req: Request) {
  try {
    const ctx = requireAdmin(req);
    const db = getD1();
    const url = new URL(req.url);
    const centerId = url.searchParams.get('centerId') || ctx.centerId;
    const month = url.searchParams.get('month'); // YYYY-MM
    if (!month) return jsonErr('month required');

    const [year, mon] = month.split('-');
    const daysInMonth = new Date(Number(year), Number(mon), 0).getDate();

    // Get all active children
    const children = await db
      .prepare('SELECT id, name, class_name FROM children WHERE center_id = ? AND is_active = 1 ORDER BY class_name, name')
      .bind(centerId)
      .all<{ id: string; name: string; class_name: string }>();

    // Get all attendance for the month
    const records = await db
      .prepare(`SELECT child_id, date, check_in, check_out FROM attendance_records
                WHERE center_id = ? AND date >= ? AND date <= ?`)
      .bind(centerId, `${month}-01`, `${month}-${String(daysInMonth).padStart(2, '0')}`)
      .all<{ child_id: string; date: string; check_in: string; check_out: string }>();

    // Build attendance map: childId -> Set of dates present
    const attendanceMap = new Map<string, Set<string>>();
    for (const r of records.results) {
      if (!attendanceMap.has(r.child_id)) attendanceMap.set(r.child_id, new Set());
      if (r.check_in) attendanceMap.get(r.child_id)!.add(r.date);
    }

    // Build report
    const report = children.results.map((child: { id: string; name: string; class_name: string }) => {
      const days = attendanceMap.get(child.id) ?? new Set<string>();
      const attendedDays = days.size;
      const absentDays = daysInMonth - attendedDays;
      return {
        child_id: child.id,
        child_name: child.name,
        class_name: child.class_name,
        year_month: month,
        total_days: daysInMonth,
        attended_days: attendedDays,
        absent_days: absentDays,
        attendance_rate: ((attendedDays / daysInMonth) * 100).toFixed(1),
        // 복지로 CSV 형식 컬럼
        daily: Array.from({ length: daysInMonth }, (_, i) => {
          const d = String(i + 1).padStart(2, '0');
          return days.has(`${month}-${d}`) ? 'O' : 'X';
        }),
      };
    });

    // Generate CSV for 복지로 upload
    const format = url.searchParams.get('format');
    if (format === 'csv') {
      const header = ['이름', '반', '출석일수', '결석일수', '출석률', ...Array.from({ length: daysInMonth }, (_, i) => `${i + 1}일`)].join(',');
      const rows = report.map((r: { child_name: string; class_name: string; attended_days: number; absent_days: number; attendance_rate: string; daily: string[] }) =>
        [r.child_name, r.class_name, r.attended_days, r.absent_days, `${r.attendance_rate}%`, ...r.daily].join(',')
      );
      const csv = [header, ...rows].join('\n');
      return new Response('\uFEFF' + csv, {  // BOM for Excel
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="attendance_${month}.csv"`,
        },
      });
    }

    return jsonOk({ month, report, total_children: children.results.length });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}
