import { Redis } from "@upstash/redis";
import type { Deal, FirstCanvas } from "./types";

// In-memory fallback for local dev when Redis env vars are not set
const memStore: { deals: Deal[]; firstCanvas: FirstCanvas } = {
  deals: [],
  firstCanvas: {},
};

function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getRedis(): Redis {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

export async function getDeals(): Promise<Deal[]> {
  if (!isRedisConfigured()) return memStore.deals;
  try {
    const data = await getRedis().get<Deal[]>("spiff-deals");
    return data ?? [];
  } catch {
    return [];
  }
}

export async function saveDeals(deals: Deal[]): Promise<void> {
  if (!isRedisConfigured()) { memStore.deals = deals; return; }
  await getRedis().set("spiff-deals", deals);
}

export async function getFirstCanvas(): Promise<FirstCanvas> {
  if (!isRedisConfigured()) return memStore.firstCanvas;
  try {
    const data = await getRedis().get<FirstCanvas>("spiff-first-canvas");
    return data ?? {};
  } catch {
    return {};
  }
}

export async function saveFirstCanvas(fc: FirstCanvas): Promise<void> {
  if (!isRedisConfigured()) { memStore.firstCanvas = fc; return; }
  await getRedis().set("spiff-first-canvas", fc);
}
