export interface ReqContext {
  role: string;
  centerId: string;
  userUid?: string;
  userName?: string;
}

export function getAuthFromReq(req: Request): ReqContext | null {
  const cookie = req.headers.get('cookie') ?? '';
  const role = parseCookie(cookie, 'kids_role');
  const centerId = parseCookie(cookie, 'kids_center_id');
  const userUid = parseCookie(cookie, 'kids_uid');
  const userName = parseCookie(cookie, 'kids_name');
  const status = parseCookie(cookie, 'kids_status');

  if (!role || !centerId) return null;
  if (status !== 'active') return null;

  return { role, centerId, userUid, userName };
}

export function requireAuth(req: Request): ReqContext {
  const ctx = getAuthFromReq(req);
  if (!ctx) throw new Error('Unauthorized');
  return ctx;
}

export function requireAdmin(req: Request): ReqContext {
  const ctx = requireAuth(req);
  if (ctx.role !== 'center_admin' && ctx.role !== 'super_admin') {
    throw new Error('Forbidden');
  }
  return ctx;
}

export function jsonOk(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function jsonErr(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function parseCookie(cookie: string, key: string): string | undefined {
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${key}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}
