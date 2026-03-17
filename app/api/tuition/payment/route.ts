export const runtime = 'edge';
import { getD1, newId, nowIso } from '../../../../lib/d1';
import { requireAdmin, jsonOk, jsonErr } from '../../../../lib/apiAuth';
import type { TuitionAccount } from '../../../../types/ops';

// Toss Payments integration
// 환경변수: TOSS_SECRET_KEY (마무리 단계에서 설정)
const TOSS_API = 'https://api.tosspayments.com/v1';

export async function POST(req: Request) {
  try {
    requireAdmin(req);
    const db = getD1();
    const body = await req.json() as {
      accountId: string;
      method: 'kakaopay' | 'virtual_account' | 'card';
      successUrl?: string;
      failUrl?: string;
    };

    const account = await db
      .prepare(`SELECT t.*, c.name as child_name, c.parent_phone
                FROM tuition_accounts t LEFT JOIN children c ON t.child_id = c.id
                WHERE t.id = ?`)
      .bind(body.accountId)
      .first<TuitionAccount & { child_name: string; parent_phone: string }>();

    if (!account) return jsonErr('account not found', 404);
    if (account.status === 'paid') return jsonErr('already paid');

    const env = (globalThis as unknown as { process?: { env: Record<string, string> } }).process?.env ?? {};
    const tossKey = env.TOSS_SECRET_KEY;

    if (!tossKey) {
      // 외부 연동 미설정 시 안내 반환
      return jsonOk({
        pending_setup: true,
        message: 'Toss Payments API key not configured. Set TOSS_SECRET_KEY to enable online payment.',
        account_id: account.id,
        amount: account.net_amount,
      });
    }

    const orderId = `AIKIDS-${account.id.slice(0, 8)}-${Date.now()}`;

    if (body.method === 'virtual_account') {
      const res = await fetch(`${TOSS_API}/virtual-accounts`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(tossKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: account.net_amount,
          orderId,
          orderName: `${account.child_name} ${account.year_month} 원비`,
          bank: 'IBK',
          customerName: account.child_name,
          customerMobilePhone: account.parent_phone,
          dueDate: account.due_date,
        }),
      });
      const data = await res.json() as { virtualAccount?: { accountNumber: string }; paymentKey?: string };
      if (!res.ok) return jsonErr(JSON.stringify(data), 502);

      await db
        .prepare('UPDATE tuition_accounts SET virtual_account = ?, pg_tid = ? WHERE id = ?')
        .bind(data.virtualAccount?.accountNumber, data.paymentKey, account.id)
        .run();

      return jsonOk({ method: 'virtual_account', accountNumber: data.virtualAccount?.accountNumber, amount: account.net_amount });
    }

    // 카카오페이 / 카드 결제 → Toss 결제창
    const res = await fetch(`${TOSS_API}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(tossKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: body.method === 'kakaopay' ? '카카오페이' : '카드',
        amount: account.net_amount,
        orderId,
        orderName: `${account.child_name} ${account.year_month} 원비`,
        successUrl: body.successUrl ?? 'https://ai-kids.genomic.cc/dashboard/tuition?result=success',
        failUrl: body.failUrl ?? 'https://ai-kids.genomic.cc/dashboard/tuition?result=fail',
      }),
    });
    const data = await res.json() as { checkout?: { url: string } };
    if (!res.ok) return jsonErr(JSON.stringify(data), 502);

    return jsonOk({ checkout_url: data.checkout?.url });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 500);
  }
}
