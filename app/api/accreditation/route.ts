export const runtime = 'edge';
import { getD1, newId, nowIso } from '../../../lib/d1';
import { requireAdmin, jsonOk, jsonErr } from '../../../lib/apiAuth';
import type { AccreditationItem, AccreditationCategory } from '../../../types/ops';

// 어린이집 평가 지표 (2023년 기준, 4개 영역 22개 지표)
const DEFAULT_INDICATORS = [
  { category: '보육과정 및 상호작용', items: [
    { code: '1-1-1', desc: '보육계획을 영유아의 발달수준과 흥미를 반영하여 수립한다' },
    { code: '1-1-2', desc: '계획한 활동은 융통성 있게 운영한다' },
    { code: '1-2-1', desc: '교사는 영유아와의 상호작용 시 온화하고 긍정적인 태도를 보인다' },
    { code: '1-2-2', desc: '교사는 영유아가 요청할 때 적절하게 반응한다' },
    { code: '1-2-3', desc: '교사는 영유아의 감정에 공감하고 정서적으로 지원한다' },
    { code: '1-3-1', desc: '하루 일과에서 영유아가 자유롭게 놀이할 수 있도록 지원한다' },
    { code: '1-3-2', desc: '실내외 흥미 영역 구성이 영유아의 발달을 지원한다' },
  ]},
  { category: '보육환경 및 운영관리', items: [
    { code: '2-1-1', desc: '보육실, 공용공간, 바깥놀이공간 등이 청결하고 쾌적하다' },
    { code: '2-1-2', desc: '시설·설비가 영유아의 발달 수준에 적합하게 구비되어 있다' },
    { code: '2-2-1', desc: '어린이집 운영관련 규정이 마련되어 있다' },
    { code: '2-2-2', desc: '어린이집 운영계획이 수립되어 있다' },
    { code: '2-3-1', desc: '보육료 등 필요경비를 정해진 기준에 따라 받고 있다' },
    { code: '2-3-2', desc: '회계관리 관련 규정이 마련되어 있다' },
  ]},
  { category: '건강·안전', items: [
    { code: '3-1-1', desc: '영유아의 청결유지 및 위생적인 환경 관리가 이루어진다' },
    { code: '3-1-2', desc: '영유아의 건강 상태를 관찰하고 적절한 조치를 취한다' },
    { code: '3-2-1', desc: '급·간식은 위생적이고 안전하게 관리된다' },
    { code: '3-3-1', desc: '어린이집 내·외부 환경이 안전하게 관리된다' },
    { code: '3-3-2', desc: '비상사태에 대비한 계획이 수립되어 있다' },
    { code: '3-3-3', desc: '등·하원 시 영유아 안전관리가 이루어진다' },
  ]},
  { category: '교직원', items: [
    { code: '4-1-1', desc: '교직원의 근무환경이 안정적으로 유지된다' },
    { code: '4-2-1', desc: '원장은 어린이집 운영에 있어 리더십을 발휘한다' },
    { code: '4-2-2', desc: '원장은 보육교직원의 전문성 향상을 위해 노력한다' },
  ]},
];

export async function GET(req: Request) {
  try {
    const ctx = requireAdmin(req);
    const db = getD1();
    const url = new URL(req.url);
    const centerId = url.searchParams.get('centerId') || ctx.centerId;

    const categories = await db
      .prepare('SELECT * FROM accreditation_categories WHERE center_id = ? ORDER BY sort_order')
      .bind(centerId)
      .all<AccreditationCategory>();

    const items = await db
      .prepare('SELECT * FROM accreditation_items WHERE center_id = ? ORDER BY indicator_code')
      .bind(centerId)
      .all<AccreditationItem>();

    // Parse evidence_urls
    const parsedItems: AccreditationItem[] = items.results.map((i: AccreditationItem) => ({
      ...i,
      evidence_urls: JSON.parse((i.evidence_urls as unknown as string) || '[]') as string[],
    }));

    // Group items by category
    const result = categories.results.map((cat: AccreditationCategory) => ({
      ...cat,
      items: parsedItems.filter((i: AccreditationItem) => i.category_id === cat.id),
    }));

    // Stats
    const stats = {
      total: parsedItems.length,
      not_started: parsedItems.filter((i) => i.status === 'not_started').length,
      in_progress: parsedItems.filter((i) => i.status === 'in_progress').length,
      ready: parsedItems.filter((i) => i.status === 'ready').length,
      submitted: parsedItems.filter((i) => i.status === 'submitted').length,
    };

    return jsonOk({ categories: result, stats });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}

// Initialize default checklist for a center
export async function POST(req: Request) {
  try {
    const ctx = requireAdmin(req);
    const db = getD1();
    const body = await req.json() as { centerId?: string };
    const centerId = body.centerId || ctx.centerId;

    // Check if already initialized
    const existing = await db
      .prepare('SELECT COUNT(*) as count FROM accreditation_categories WHERE center_id = ?')
      .bind(centerId)
      .first<{ count: number }>();

    if (existing && existing.count > 0) {
      return jsonErr('Checklist already initialized for this center');
    }

    for (let i = 0; i < DEFAULT_INDICATORS.length; i++) {
      const cat = DEFAULT_INDICATORS[i];
      const catId = newId();
      await db
        .prepare('INSERT INTO accreditation_categories (id, center_id, label, sort_order) VALUES (?, ?, ?, ?)')
        .bind(catId, centerId, cat.category, i)
        .run();

      for (const item of cat.items) {
        await db
          .prepare(`INSERT INTO accreditation_items (id, category_id, center_id, indicator_code, description, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)`)
          .bind(newId(), catId, centerId, item.code, item.desc, nowIso())
          .run();
      }
    }

    return jsonOk({ initialized: true, categories: DEFAULT_INDICATORS.length }, 201);
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 500);
  }
}

export async function PATCH(req: Request) {
  try {
    requireAdmin(req);
    const db = getD1();
    const body = await req.json() as { items: { id: string; status: AccreditationItem['status']; notes?: string; evidenceUrls?: string[] }[] };
    if (!body.items?.length) return jsonErr('items required');

    for (const item of body.items) {
      await db
        .prepare('UPDATE accreditation_items SET status = ?, notes = ?, evidence_urls = ?, updated_at = ? WHERE id = ?')
        .bind(item.status, item.notes ?? null, JSON.stringify(item.evidenceUrls ?? []), nowIso(), item.id)
        .run();
    }

    return jsonOk({ updated: body.items.length });
  } catch (e: unknown) {
    return jsonErr((e as Error).message, 401);
  }
}
