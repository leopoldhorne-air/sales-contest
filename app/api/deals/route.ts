import { NextResponse } from "next/server";
import { getDeals, getFirstCanvas, getTotalARR, addDeal, deleteDeal, markFirstCanvas, findDealBySfId } from "@/lib/store";
import type { Deal } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const [deals, firstCanvas, arrSnapshot] = await Promise.all([getDeals(), getFirstCanvas(), getTotalARR()]);
  return NextResponse.json({ deals, firstCanvas, totalARR: arrSnapshot.value, totalARRUpdatedAt: arrSnapshot.updatedAt });
}

export async function POST(request: Request) {
  try {
    const deal: Deal = await request.json();

    // Dedup check — if this SF opportunity was already logged, reject it
    if (deal.sfId) {
      const existing = await findDealBySfId(deal.sfId);
      if (existing) {
        return NextResponse.json(
          { error: "duplicate", message: "This Salesforce opportunity has already been logged." },
          { status: 409 }
        );
      }
    }

    await addDeal(deal);

    if (deal.actions.includes("first_canvas")) {
      await markFirstCanvas(deal.rep);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("POST /api/deals failed:", message);
    return NextResponse.json({ error: "server_error", message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id }: { id: string } = await request.json();
    await deleteDeal(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "server_error", message }, { status: 500 });
  }
}
