import { NextResponse } from "next/server";
import { getDeals, saveDeals } from "@/lib/store";
import type { Deal, Team } from "@/lib/types";

export async function POST(request: Request) {
  // Validate secret header
  const secret = request.headers.get("x-webhook-secret");
  if (!process.env.WEBHOOK_SECRET || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();

  // Salesforce opportunity ID — used to prevent duplicate deals
  const sfId: string = payload.sfId || payload.Id || payload.opportunity_id || "";
  if (!sfId) {
    return NextResponse.json({ error: "Missing Salesforce ID (sfId)" }, { status: 400 });
  }

  const deals = await getDeals();

  // Skip if we've already ingested this deal
  if (deals.some((d) => d.sfId === sfId)) {
    return NextResponse.json({ skipped: true, reason: "Deal already exists" });
  }

  const newDeal: Deal = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    sfId,
    // Zapier field mapping — adjust these keys to match your SF report fields
    team: (payload.team as Team) || "Sales",
    rep: payload.rep || payload.owner_name || "",
    actions: Array.isArray(payload.actions) ? payload.actions : [],
    points: Number(payload.points) || 0,
    arr: Number(payload.arr ?? payload.amount ?? 0) || 0,
    account: payload.account || payload.account_name || "",
    notes: payload.notes || "",
    gong: payload.gong || "",
    isLegacy: payload.isLegacy === true || payload.isLegacy === "true",
    date: new Date().toISOString(),
  };

  await saveDeals([...deals, newDeal]);
  return NextResponse.json({ success: true, deal: newDeal });
}
