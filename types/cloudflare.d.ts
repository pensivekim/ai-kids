// Minimal Cloudflare D1 type declarations for edge runtime
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = unknown>(): Promise<{ results: T[]; success: boolean }>;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<{ success: boolean; meta: unknown }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<{ count: number; duration: number }>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<{ results: T[] }[]>;
}
