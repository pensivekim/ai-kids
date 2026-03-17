import { getRequestContext } from '@cloudflare/next-on-pages';

export function getD1(): D1Database {
  const { env } = getRequestContext();
  return (env as unknown as { DB: D1Database }).DB;
}

export function newId(): string {
  return globalThis.crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function yearMonthStr(date?: Date): string {
  const d = date ?? new Date();
  return d.toISOString().slice(0, 7); // YYYY-MM
}
