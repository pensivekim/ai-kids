export const runtime = 'edge';
import { getD1, newId, nowIso } from '../../../../lib/d1';
import { jsonOk, jsonErr } from '../../../../lib/apiAuth';
import { sendAlimtalk } from '../../../../lib/nhn';
import type { TuitionAccount } from '../../../../types/ops';

// Toss Payments Webhook
// 웹훅 시크릿 검증 후 결제 상태 업데이트
export async function POST(req: Request) {
  try {
    const db = getD1();
    const env = (globalThis as unknown as { process?: { env: Record<string, string> } }).process?.env ?? {};

    const body = await req.json() as {
      eventType: string;
      data: {
        paymentKey: string;
        orderId: string;
        status: string;
        totalAmount: number;
        method: string;
        virtualAccount?: { accountNumber: string };
      };
    };

    if (body.eventType === 'PAYMENT_STATUS_CHANGED' && body.data.status === 'DONE') {
      // orderId format: AIKIDS-{accountId8chars}-{timestamp}
      const parts = body.data.orderId.split('-');
      const accountIdPrefix = parts[1];

      const account = await db
        .prepare(`SELECT t.*, c.parent_phone, c.name as child_name
                  FROM tuition_accounts t LEFT JOIN children c ON t.child_id = c.id
                  WHERE t.id LIKE ?`)
        .bind(`${accountIdPrefix}%`)
        .first<TuitionAccount & { parent_phone: string; child_name: string }>();

      if (account) {
        await db
          .prepare('UPDATE tuition_accounts SET status = ?, pg_tid = ?, paid_at = ? WHERE id = ?')
          .bind('paid', body.data.paymentKey, nowIso(), account.id)
          .run();

        await db
          .prepare('INSERT INTO tuition_payments (id, account_id, amount, method, pg_response, created_at) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(newId(), account.id, body.data.totalAmount, body.data.method, JSON.stringify(body.data), nowIso())
          .run();

        // 납부 완료 알림톡
        if (account.parent_phone) {
          await sendAlimtalk(
            env as Parameters<typeof sendAlimtalk>[0],
            'TUITION_PAID',  // 마무리 단계에서 NHN 템플릿 코드 등록
            account.parent_phone,
            {
              child_name: account.child_name,
              year_month: account.year_month,
              amount: account.net_amount.toLocaleString(),
            }
          );
        }
      }
    }

    return jsonOk({ ok: true });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 500);
  }
}
