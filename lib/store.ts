import { createClient } from "@supabase/supabase-js";
import type { Deal, FirstCanvas } from "./types";

const supabaseKey = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY || "";

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, supabaseKey());
}

function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && supabaseKey());
}

// In-memory fallback for local dev without Supabase credentials
const memStore: { deals: Deal[]; firstCanvas: FirstCanvas; totalARR: number; totalARRUpdatedAt: string | null } = {
  deals: [],
  firstCanvas: {},
  totalARR: 0,
  totalARRUpdatedAt: null,
};

// ─── Row mapping ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToDeal(row: any): Deal {
  return {
    id: row.id,
    team: row.team,
    rep: row.rep,
    actions: row.actions ?? [],
    points: row.points,
    arr: row.arr,
    account: row.account ?? "",
    notes: row.notes ?? "",
    gong: row.gong ?? "",
    sfLink: row.sf_link ?? "",
    isLegacy: row.is_legacy,
    date: row.date,
    sfId: row.sf_id ?? undefined,
  };
}

function dealToRow(deal: Deal) {
  return {
    id: deal.id,
    team: deal.team,
    rep: deal.rep,
    actions: deal.actions,
    points: deal.points,
    arr: deal.arr,
    account: deal.account,
    notes: deal.notes,
    gong: deal.gong,
    sf_link: deal.sfLink ?? "",
    is_legacy: deal.isLegacy,
    date: deal.date,
    sf_id: deal.sfId ?? null,
  };
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getDeals(): Promise<Deal[]> {
  if (!isSupabaseConfigured()) return memStore.deals;
  const { data, error } = await getSupabase()
    .from("deals")
    .select("*")
    .order("date", { ascending: true });
  if (error) { console.error("getDeals error:", error); return []; }
  return (data ?? []).map(rowToDeal);
}

export async function getFirstCanvas(): Promise<FirstCanvas> {
  if (!isSupabaseConfigured()) return memStore.firstCanvas;
  const { data, error } = await getSupabase().from("first_canvas").select("rep");
  if (error) { console.error("getFirstCanvas error:", error); return {}; }
  const fc: FirstCanvas = {};
  (data ?? []).forEach((row) => { fc[row.rep] = true; });
  return fc;
}

export async function findDealBySfId(sfId: string): Promise<Deal | null> {
  if (!isSupabaseConfigured()) return memStore.deals.find((d) => d.sfId === sfId) ?? null;
  const { data } = await getSupabase().from("deals").select("*").eq("sf_id", sfId).maybeSingle();
  return data ? rowToDeal(data) : null;
}

// ─── Atomic writes (preferred for API routes) ────────────────────────────────

export async function addDeal(deal: Deal): Promise<void> {
  if (!isSupabaseConfigured()) { memStore.deals = [...memStore.deals, deal]; return; }
  const { error } = await getSupabase().from("deals").insert(dealToRow(deal));
  if (error) throw new Error(`addDeal error: ${error.message}`);
}

export async function deleteDeal(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    memStore.deals = memStore.deals.filter((d) => d.id !== id);
    return;
  }
  const { error } = await getSupabase().from("deals").delete().eq("id", id);
  if (error) throw new Error(`deleteDeal error: ${error.message}`);
}

export async function markFirstCanvas(rep: string): Promise<void> {
  if (!isSupabaseConfigured()) { memStore.firstCanvas[rep] = true; return; }
  const { error } = await getSupabase()
    .from("first_canvas")
    .upsert({ rep, claimed: true }, { onConflict: "rep" });
  if (error) throw new Error(`markFirstCanvas error: ${error.message}`);
}

// ─── Total ARR snapshot (written by Zapier, read by UI) ──────────────────────

export async function getTotalARR(): Promise<{ value: number; updatedAt: string | null }> {
  if (!isSupabaseConfigured()) return { value: memStore.totalARR, updatedAt: memStore.totalARRUpdatedAt };
  const { data } = await getSupabase()
    .from("settings")
    .select("key, value")
    .in("key", ["total_arr", "total_arr_updated_at"]);
  const rows = data ?? [];
  const val = rows.find((r) => r.key === "total_arr");
  const ts = rows.find((r) => r.key === "total_arr_updated_at");
  return {
    value: val ? parseInt(val.value, 10) || 0 : 0,
    updatedAt: ts?.value ?? null,
  };
}

export async function setTotalARR(value: number): Promise<void> {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured()) {
    memStore.totalARR = value;
    memStore.totalARRUpdatedAt = now;
    return;
  }
  const { error } = await getSupabase()
    .from("settings")
    .upsert(
      [
        { key: "total_arr", value: String(value) },
        { key: "total_arr_updated_at", value: now },
      ],
      { onConflict: "key" }
    );
  if (error) throw new Error(`setTotalARR error: ${error.message}`);
}

// ─── Bulk writes (kept for webhook compatibility) ─────────────────────────────

export async function saveDeals(deals: Deal[]): Promise<void> {
  if (!isSupabaseConfigured()) { memStore.deals = deals; return; }
  const { error } = await getSupabase()
    .from("deals")
    .upsert(deals.map(dealToRow), { onConflict: "id" });
  if (error) throw new Error(`saveDeals error: ${error.message}`);
}

export async function saveFirstCanvas(fc: FirstCanvas): Promise<void> {
  if (!isSupabaseConfigured()) { memStore.firstCanvas = fc; return; }
  const rows = Object.keys(fc).map((rep) => ({ rep, claimed: true }));
  if (rows.length === 0) return;
  const { error } = await getSupabase()
    .from("first_canvas")
    .upsert(rows, { onConflict: "rep" });
  if (error) throw new Error(`saveFirstCanvas error: ${error.message}`);
}
